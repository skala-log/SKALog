package com.skalog.notice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Gemini API 최소 클라이언트. 공지 한 줄 요약 하나만 한다. 무료 티어(flash-lite)로 충분한 볼륨. */
@Component
public class GeminiClient {

    /** 공지가 아니라고 판단되면 모델이 이 값을 돌려준다. */
    static final String PASS = "PASS";
    /** 최근 공지와 같은 내용이면 "DUP:<notice id>"를 돌려준다. */
    static final String DUP_PREFIX = "DUP:";

    // 스케줄러 스레드를 자료 수집과 공유하므로, 응답이 멈춰도 여기서 끊어야 자료 수집까지 같이 멈추지 않는다.
    private static final Duration TIMEOUT = Duration.ofSeconds(30);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter POSTED_AT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd(E) HH:mm", Locale.KOREAN).withZone(KST);
    private static final DateTimeFormatter RECENT_DATE = DateTimeFormatter.ofPattern("MM/dd").withZone(KST);

    // 규칙 하나하나가 실제 채널 메시지 평가(요약 15건 + 중복 9건)에서 문제 났던 것에 대응한다 — 지우기 전에 같은 세트로 재검증할 것.
    // 게시 시각은 "오늘까지"·"1시간 내"를 절대 일시로 바꾸는 데 쓰인다. 날짜만 주면 시각을 지어낸다.
    // 중복 규칙의 반례(급식 주차·층·차수)는 없으면 같은 종류의 다른 공지를 전부 DUP로 오판한다.
    private static final String PROMPT = """
            너는 SKALA 교육생 홈 화면의 공지 요약기다. 슬랙 메시지 하나를 공지 한 줄로 요약한다.

            규칙:
            - 한국어 한 문장, 40자 이내. 마감·행사 일시, 대상, 해야 할 일이 있으면 반드시 담아라.
            - "오늘/내일/이번 주/N시간 내" 같은 상대 표현은 게시 시각 기준 절대 일시(M/D HH:MM)로 바꿔라.
            - 게시 시각 자체는 요약에 넣지 마라. 날짜는 메시지가 말하는 마감·행사 일시만 쓴다.
            - 여러 그룹(층·반)에 다른 값이 있으면 특정 그룹만 쓰지 말고 전부 담아라.
            - URL은 넣지 마라. 원문 링크는 따로 제공된다.
            - 아래 '최근 공지 목록'에 같은 내용(같은 행사·같은 마감·같은 안내를 다시 알리는 것)이 이미 있으면 요약 대신 DUP:번호 만 출력하라. 단, 날짜·기간·층·차수가 하나라도 다르면 같은 종류라도 다른 공지다 — 예: 8/24 주 급식표와 8/31 주 급식표, 4층 취업캠프와 5층 취업캠프, 1차 단위기간과 2차 단위기간은 서로 다른 공지다. 확실하지 않으면 DUP 대신 요약하라.
            - 요약문 외에 아무것도 출력하지 마라.
            - 다음은 공지가 아니다. PASS 만 출력하라: 잡담·단순 답글, 실습 명령어 안내, 외부 뉴스 기사 링크 공유, 개인 견해를 정리한 긴 칼럼.
            - 교육생이 이용·등록·제출·참석해야 하는 서비스·자료·일정 안내는 짧아도 공지다.

            예시:
            메시지: <!here> 8/24(월)~8/28(금) 주간은 아래와 같이 식사합니다. [4층] 11:50 2반 → 12:00 1,3반 → 12:10 4,5반 [5층] 12:20 7반 → 12:30 6,8반 → 12:40 9,10반
            요약: 8/24~28 점심: 4층 11:50 2반→1,3반→4,5반 / 5층 12:20 7반→6,8반→9,10반

            메시지: *[판교4층 취업캠프 사전 준비사항 안내]* 판교4층 취업캠프가 9/7(월) 진행됩니다. 자소서 파일을 개인별로 준비…
            요약: 9/7(월) 판교4층 취업캠프 — 자소서 파일 미리 준비

            메시지: 4반 준비됐습니다~
            요약: PASS

            최근 공지 목록(번호. 게시일 요약):
            %s

            게시 시각: %s
            메시지:
            """;

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String model;

    public GeminiClient(
            @Value("${gemini.api-key}") String apiKey,
            @Value("${gemini.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    public boolean enabled() {
        return !apiKey.isBlank();
    }

    /**
     * 한 줄 요약을 돌려준다. 공지가 아니면 PASS, 최근 공지와 같은 내용이면 DUP:id, API 실패 시 예외.
     * 실패는 호출부에서 skip 처리해 다음 수집 주기에 자연 재시도된다.
     */
    public String summarize(String text, OffsetDateTime postedAt, List<Notice> recent)
            throws IOException, InterruptedException {
        String recentList = recent.isEmpty()
                ? "(없음)"
                : recent.stream()
                        .map(n -> n.getId() + ". " + RECENT_DATE.format(n.getPostedAt()) + " " + n.getTitle())
                        .collect(Collectors.joining("\n"));
        String prompt = PROMPT.formatted(recentList, POSTED_AT.format(postedAt)) + text;
        String body = objectMapper.writeValueAsString(Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("temperature", 0.2)));

        // 키는 헤더로 — 쿼리스트링에 실으면 프록시·접근 로그에 남는다.
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent"))
                .timeout(TIMEOUT)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IOException("Gemini API 오류: HTTP " + response.statusCode());
        }
        return extractText(objectMapper.readTree(response.body()));
    }

    /** generateContent 응답에서 candidates[0].content.parts[0].text를 뽑는다. */
    static String extractText(JsonNode root) throws IOException {
        JsonNode text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (text.isMissingNode()) {
            throw new IOException("Gemini 응답에 텍스트가 없음: " + root);
        }
        return text.asText().strip();
    }

    /** 모델이 'PASS.'·'**PASS**'·'pass'처럼 변형해 답해도 PASS로 본다. 빈 답도 공지로 저장할 수 없으니 PASS. */
    static boolean isPass(String summary) {
        String normalized = summary.replaceAll("[^\\p{L}\\p{N}]", "").toUpperCase();
        return normalized.isEmpty() || normalized.equals(PASS);
    }

    /** "DUP:12" → 12. DUP 응답이 아니거나 번호가 이상하면 null. */
    static Long parseDup(String summary) {
        String s = summary.strip().replaceAll("^[*`]+|[*`.]+$", "");
        if (!s.toUpperCase().startsWith(DUP_PREFIX)) return null;
        try {
            return Long.parseLong(s.substring(DUP_PREFIX.length()).strip());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
