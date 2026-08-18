package com.skalog.slack;

import com.skalog.material.Material;
import com.skalog.material.MaterialKind;
import com.skalog.material.MaterialRepository;
import com.skalog.schedule.Schedule;
import com.skalog.schedule.ScheduleRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

// ponytail: 로그인(6단계) 전까지 반을 판교 1반으로 고정. 로그인 붙으면 채널↔반 매핑으로 교체.
@Component
public class MaterialCollector {

    private static final Logger log = LoggerFactory.getLogger(MaterialCollector.class);
    private static final Long CLASS_ID = 1L;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    // 슬랙 메시지 텍스트의 링크는 <url> 또는 <url|라벨> 형태로 온다.
    private static final Pattern SLACK_LINK_PATTERN = Pattern.compile("<(https?://[^|>]+)(?:\\|([^>]*))?>");
    private static final Pattern BARE_URL_PATTERN = Pattern.compile("https?://\\S+");

    private final SlackClient slackClient;
    private final SlackProperties properties;
    private final MaterialRepository materialRepository;
    private final ScheduleRepository scheduleRepository;

    public MaterialCollector(
            SlackClient slackClient,
            SlackProperties properties,
            MaterialRepository materialRepository,
            ScheduleRepository scheduleRepository) {
        this.slackClient = slackClient;
        this.properties = properties;
        this.materialRepository = materialRepository;
        this.scheduleRepository = scheduleRepository;
    }

    /** 채널 하나가 실패해도 나머지 채널은 계속 돈다. */
    public void collect() {
        for (String channelId : properties.materialChannelIds()) {
            try {
                collectChannel(channelId);
            } catch (Exception e) {
                log.error("슬랙 채널 {} 수집 실패", channelId, e);
            }
        }
    }

    private void collectChannel(String channelId) throws Exception {
        for (SlackMessage message : slackClient.history(channelId)) {
            for (MaterialCandidate candidate : extractCandidates(message)) {
                if (materialRepository.existsBySourceRef(candidate.sourceRef())) continue;
                Long scheduleId = scheduleRepository
                        .findByClassIdAndDate(CLASS_ID, tsToKstDate(candidate.ts()))
                        .map(Schedule::getId)
                        .orElse(null);
                materialRepository.save(new Material(
                        scheduleId, candidate.title(), candidate.kind(), candidate.url(), candidate.sourceRef()));
            }
        }
    }

    /** 메시지 하나에서 자료 후보를 뽑는다. 파일 있으면 파일마다 하나, 없고 URL만 있으면 링크 하나. */
    static List<MaterialCandidate> extractCandidates(SlackMessage message) {
        List<MaterialCandidate> candidates = new ArrayList<>();
        if (!message.files().isEmpty()) {
            for (SlackMessage.SlackFile file : message.files()) {
                candidates.add(new MaterialCandidate(
                        file.name(), MaterialKind.FILE, file.urlPrivate(), file.id(), message.ts()));
            }
            return candidates;
        }
        Matcher slackLink = SLACK_LINK_PATTERN.matcher(message.text());
        if (slackLink.find()) {
            String url = slackLink.group(1);
            String label = slackLink.group(2);
            String title = (label != null && !label.isBlank()) ? label : url;
            candidates.add(new MaterialCandidate(truncate(title), MaterialKind.LINK, url, message.ts(), message.ts()));
            return candidates;
        }
        Matcher bareUrl = BARE_URL_PATTERN.matcher(message.text());
        if (bareUrl.find()) {
            candidates.add(new MaterialCandidate(
                    truncate(message.text()), MaterialKind.LINK, bareUrl.group(), message.ts(), message.ts()));
        }
        return candidates;
    }

    private static String truncate(String s) {
        return s.length() > 60 ? s.substring(0, 60) : s;
    }

    /** 슬랙 ts(초 단위, 소수점 포함 문자열)를 KST 날짜로 변환한다. */
    static LocalDate tsToKstDate(String ts) {
        double epochSeconds = Double.parseDouble(ts);
        return Instant.ofEpochMilli((long) (epochSeconds * 1000)).atZone(KST).toLocalDate();
    }

    record MaterialCandidate(String title, MaterialKind kind, String url, String sourceRef, String ts) {}
}
