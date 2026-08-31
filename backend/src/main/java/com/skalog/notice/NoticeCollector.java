package com.skalog.notice;

import com.skalog.slack.MaterialCollector;
import com.skalog.slack.SlackClient;
import com.skalog.slack.SlackMessage;
import com.skalog.slack.SlackProperties;
import com.skalog.slack.SlackProperties.NoticeChannel;
import com.skalog.user.ClassGroupRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 공지 채널을 폴링해 새 메시지를 LLM 한 줄 요약으로 저장한다.
 * PASS·중복 판정은 메모리에 기억해 같은 메시지로 예산을 반복 소모하지 않고, 요약 실패는 한 시간 뒤 다시 시도한다.
 * 같은 내용이 여러 채널에 올라오면(재게시·공유) 독자가 겹치는 만큼만 하나로 합치고, 더 넓은 범위가 이긴다.
 */
@Component
public class NoticeCollector {

    private static final Logger log = LoggerFactory.getLogger(NoticeCollector.class);
    /** 이 기간보다 오래된 메시지는 요약 대상에서 제외 — 첫 가동 시 과거 전체를 백필하지 않는다. */
    static final Duration WINDOW = Duration.ofDays(7);
    /** 호출 간격. 무료 티어 분당 한도(15 RPM)를 이걸로 지킨다 — 4초당 1회. */
    static final Duration CALL_INTERVAL = Duration.ofSeconds(4);
    // 실행 1회당 호출 상한 — 폭주 방지용. PASS도 호출이라 실습 메시지가 많은 반 채널이 꽤 쓴다.
    // 30 × 4초 = 2분. 재시작 시 7일치 재판정(반 채널당 15~20건)이 한두 실행 안에 끝나는 크기.
    static final int BUDGET_PER_RUN = 30;
    /** 요약 실패(429·타임아웃 등) 후 재시도까지 간격. 일일 한도가 풀리면 자연히 회복된다. */
    static final Duration RETRY_AFTER = Duration.ofHours(1);
    /** 요약 대상 텍스트 최대 길이 — 아주 긴 글은 앞부분만 보내도 요약엔 충분하다. */
    static final int MAX_TEXT_LENGTH = 4000;
    /** 중복 판정 안전망에 쓰는 날짜(M/D, M월 D일)·차수·층 토큰. */
    private static final Pattern DATE_TOKEN =
            Pattern.compile("(\\d{1,2})\\s*/\\s*(\\d{1,2})|(\\d{1,2})월\\s*(\\d{1,2})일|(\\d+)\\s*차|(\\d+)\\s*층");

    private final SlackClient slackClient;
    private final SlackProperties properties;
    private final GeminiClient geminiClient;
    private final NoticeRepository noticeRepository;
    private final ClassGroupRepository classGroupRepository;

    // ponytail: PASS·중복 판정을 메모리에만 기억 — 재시작하면 윈도우 내 메시지를 한 번 더 판정한다.
    // 낭비는 재시작당 수십 콜 수준이라 무시. 문제되면 DB에 skip 기록으로 승격.
    private final Set<String> skippedRefs = ConcurrentHashMap.newKeySet();
    /** 요약 실패한 메시지의 다음 시도 시각. 영구 포기는 없다 — 윈도우를 벗어나면 자연히 잊힌다. */
    private final Map<String, Instant> retryAfter = new ConcurrentHashMap<>();

    public NoticeCollector(
            SlackClient slackClient,
            SlackProperties properties,
            GeminiClient geminiClient,
            NoticeRepository noticeRepository,
            ClassGroupRepository classGroupRepository) {
        this.slackClient = slackClient;
        this.properties = properties;
        this.geminiClient = geminiClient;
        this.noticeRepository = noticeRepository;
        this.classGroupRepository = classGroupRepository;
    }

    /** 채널 하나가 실패해도 나머지 채널은 계속 돈다. */
    public void collect() {
        if (!geminiClient.enabled()) {
            log.debug("GEMINI_API_KEY 미설정 — 공지 수집 건너뜀");
            return;
        }
        int budget = BUDGET_PER_RUN;
        for (NoticeChannel channel : channels()) {
            try {
                budget = collectChannel(channel, budget);
            } catch (Exception e) {
                log.error("공지 채널 {} 수집 실패", channel.channelId(), e);
            }
            if (budget <= 0) return;
        }
    }

    /**
     * 넓은 채널(층·캠퍼스, yml)부터 훑고 반 채널(class_group.slack_channel_id)은 뒤에.
     * 같은 공지가 반에 재게시됐을 때 넓은 쪽이 먼저 저장돼야 재게시가 중복으로 걸러진다.
     */
    private List<NoticeChannel> channels() {
        List<NoticeChannel> channels = new ArrayList<>(properties.noticeChannels());
        classGroupRepository.findAll().stream()
                .filter(g -> g.getSlackChannelId() != null)
                .forEach(g -> channels.add(new NoticeChannel(
                        g.getSlackChannelId(), NoticeScope.CLASS, "우리반", g.getId(), g.getCampus(), null)));
        return channels;
    }

    /** 남은 budget을 돌려준다. 슬랙은 최신 메시지부터 주므로 최신 공지가 먼저 요약된다. */
    private int collectChannel(NoticeChannel channel, int budget) throws Exception {
        Instant cutoff = Instant.now().minus(WINDOW);
        Instant since = channel.sinceInstant();
        if (since != null && since.isAfter(cutoff)) cutoff = since;
        for (SlackMessage message : slackClient.history(channel.channelId())) {
            if (budget <= 0) break;
            if (message.text().isBlank()) continue;
            Instant postedAt = MaterialCollector.tsToInstant(message.ts());
            if (postedAt.isBefore(cutoff)) break; // 최신순이라 이후는 전부 더 오래됨
            String sourceRef = channel.channelId() + ":" + message.ts();
            if (skippedRefs.contains(sourceRef) || noticeRepository.existsBySourceRef(sourceRef)) continue;
            Instant retry = retryAfter.get(sourceRef);
            if (retry != null && Instant.now().isBefore(retry)) continue;

            String text = cleanSlackMarkup(message.text());
            if (text.length() > MAX_TEXT_LENGTH) text = text.substring(0, MAX_TEXT_LENGTH);
            OffsetDateTime postedAtUtc = OffsetDateTime.ofInstant(postedAt, ZoneOffset.UTC);
            // 매 메시지마다 다시 읽는다 — 같은 실행에서 방금 저장한 공지도 다음 메시지의 중복 후보가 되도록.
            List<Notice> recent = noticeRepository.findTop30ByPostedAtAfterOrderByPostedAtDesc(
                    OffsetDateTime.now(ZoneOffset.UTC).minus(WINDOW));

            budget--;
            String summary = summarizeOrNull(text, postedAtUtc, recent, sourceRef);
            if (summary == null) continue;

            Long dupId = GeminiClient.parseDup(summary);
            if (dupId != null) {
                Notice existing = recent.stream().filter(n -> n.getId().equals(dupId)).findFirst().orElse(null);
                if (existing != null && sharesDateTokens(text, existing.getTitle())) {
                    log.info("중복 공지 ref={} → 기존 #{} '{}'", sourceRef, existing.getId(), existing.getTitle());
                    boolean existingCovers = covers(
                            existing.getScope(), existing.getClassId(), existing.getCampus(),
                            channel.scope(), channel.classId(), channel.campus());
                    boolean channelCovers = covers(
                            channel.scope(), channel.classId(), channel.campus(),
                            existing.getScope(), existing.getClassId(), existing.getCampus());
                    if (existingCovers) { // 이 채널 독자는 이미 보고 있다
                        skippedRefs.add(sourceRef);
                        continue;
                    }
                    if (channelCovers) { // 새 채널이 더 넓다 — 기존 행을 넓힌다
                        existing.widenTo(channel.scope(), channel.label(), channel.classId(), channel.campus());
                        noticeRepository.save(existing);
                        skippedRefs.add(sourceRef);
                        continue;
                    }
                    // 독자가 겹치지 않는다(다른 반·다른 층) — 이 채널 독자를 위해 따로 저장. 아래 재요약으로 이어진다.
                    log.info("중복이지만 독자가 다름 ref={} — 별도 저장", sourceRef);
                } else {
                    log.info("중복 판정 거부 ref={} 응답={}", sourceRef, summary);
                }
                // 요약문이 필요하다 — 중복 목록 없이 다시 받는다. 드문 경로라 호출 1회 추가는 감수.
                budget--;
                summary = summarizeOrNull(text, postedAtUtc, List.of(), sourceRef);
                if (summary == null) continue;
                if (GeminiClient.parseDup(summary) != null) { // 목록도 없는데 또 DUP — 더 볼 것 없다
                    skippedRefs.add(sourceRef);
                    continue;
                }
            }
            if (GeminiClient.isPass(summary)) {
                skippedRefs.add(sourceRef);
                continue;
            }
            noticeRepository.save(new Notice(
                    truncate(summary),
                    channel.scope(),
                    channel.label(),
                    channel.classId(),
                    channel.campus(),
                    postedAtUtc,
                    fetchPermalink(channel.channelId(), message.ts()),
                    sourceRef));
        }
        return budget;
    }

    /** 실패하면 null — 한 시간 뒤 다시 시도한다. 일일 한도 소진처럼 시간이 지나야 풀리는 실패를 영구 유실로 만들지 않기 위해. */
    private String summarizeOrNull(String text, OffsetDateTime postedAt, List<Notice> recent, String sourceRef)
            throws InterruptedException {
        Thread.sleep(CALL_INTERVAL.toMillis());
        try {
            String summary = geminiClient.summarize(text, postedAt, recent);
            retryAfter.remove(sourceRef);
            return summary;
        } catch (Exception e) {
            log.warn("공지 요약 실패 — {} 뒤 재시도 ref={}", RETRY_AFTER, sourceRef, e);
            retryAfter.put(sourceRef, Instant.now().plus(RETRY_AFTER));
            return null;
        }
    }

    /**
     * a의 독자가 b의 독자를 전부 포함하는가. 모두(CAMPUS) ⊇ 층 ⊇ 그 층의 반.
     * 4층 공지는 5층 반을 포함하지 않고, 1반 공지는 2반을 포함하지 않는다.
     */
    static boolean covers(
            NoticeScope aScope, Long aClassId, String aCampus,
            NoticeScope bScope, Long bClassId, String bCampus) {
        return switch (aScope) {
            case CAMPUS -> true;
            case FLOOR -> bScope != NoticeScope.CAMPUS && Objects.equals(aCampus, bCampus);
            case CLASS -> bScope == NoticeScope.CLASS && Objects.equals(aClassId, bClassId);
        };
    }

    private static String truncate(String s) {
        return s.length() > 300 ? s.substring(0, 300) : s;
    }

    /** 슬랙 마크업을 걷어낸다: <!here>·<@U…>는 제거, <url|label>은 label만, <url>은 url만. 요약에 원시 ID가 섞이지 않게. */
    static String cleanSlackMarkup(String text) {
        return text
                .replaceAll("<!(?:here|channel|everyone)>", "")
                .replaceAll("<@[A-Z0-9]+>", "")
                .replaceAll("<(?:https?://|tel:)[^|>]+\\|([^>]*)>", "$1")
                .replaceAll("<(https?://[^>]+)>", "$1")
                .strip();
    }

    /**
     * 중복 판정 안전망. 모델이 "지난주 급식표"·"5층 취업캠프"처럼 같은 종류의 다른 공지를 DUP로 오판하는 걸 막는다:
     * 양쪽 다 날짜·차수·층 토큰이 있는데 하나도 안 겹치면 다른 공지다. 한쪽이라도 토큰이 없으면 모델 판단을 따른다.
     */
    static boolean sharesDateTokens(String newText, String existingTitle) {
        Set<String> a = dateTokens(newText);
        Set<String> b = dateTokens(existingTitle);
        if (a.isEmpty() || b.isEmpty()) return true;
        a.retainAll(b);
        return !a.isEmpty();
    }

    private static Set<String> dateTokens(String s) {
        Set<String> tokens = new HashSet<>();
        Matcher m = DATE_TOKEN.matcher(s);
        while (m.find()) {
            if (m.group(1) != null) tokens.add(Integer.parseInt(m.group(1)) + "/" + Integer.parseInt(m.group(2)));
            else if (m.group(3) != null) tokens.add(Integer.parseInt(m.group(3)) + "/" + Integer.parseInt(m.group(4)));
            else if (m.group(5) != null) tokens.add(m.group(5) + "차");
            else tokens.add(m.group(6) + "층");
        }
        return tokens;
    }

    /** permalink 조회가 실패해도 공지 저장 자체는 계속되도록 null로 남긴다. */
    private String fetchPermalink(String channelId, String ts) {
        try {
            return slackClient.getPermalink(channelId, ts);
        } catch (Exception e) {
            log.warn("permalink 조회 실패 channel={} ts={}", channelId, ts, e);
            return null;
        }
    }
}
