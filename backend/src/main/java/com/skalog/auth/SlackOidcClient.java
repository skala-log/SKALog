package com.skalog.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skalog.slack.SlackProperties;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Component;

/** 슬랙 "Sign in with Slack"(OpenID Connect) 클라이언트. 봇 API용 SlackClient와는 별개 자격증명(client id/secret)을 쓴다. */
@Component
public class SlackOidcClient {

    private static final String AUTHORIZE_URL = "https://slack.com/openid/connect/authorize";
    private static final String TOKEN_URL = "https://slack.com/api/openid.connect.token";
    private static final String USERINFO_URL = "https://slack.com/api/openid.connect.userInfo";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SlackProperties properties;

    public SlackOidcClient(SlackProperties properties) {
        this.properties = properties;
    }

    private String redirectUri() {
        return properties.redirectBaseUri() + "/api/auth/slack/callback";
    }

    public String authorizeUrl() {
        return AUTHORIZE_URL
                + "?response_type=code"
                + "&scope=" + encode("openid profile")
                + "&client_id=" + encode(properties.clientId())
                + "&redirect_uri=" + encode(redirectUri());
    }

    public SlackIdentity exchangeCode(String code) throws IOException, InterruptedException {
        String accessToken = fetchAccessToken(code);
        return fetchIdentity(accessToken);
    }

    private String fetchAccessToken(String code) throws IOException, InterruptedException {
        String body = "client_id=" + encode(properties.clientId())
                + "&client_secret=" + encode(properties.clientSecret())
                + "&code=" + encode(code)
                + "&redirect_uri=" + encode(redirectUri())
                + "&grant_type=authorization_code";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(TOKEN_URL))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode json = objectMapper.readTree(response.body());
        if (!json.path("ok").asBoolean(false)) {
            throw new IOException("슬랙 토큰 교환 실패: " + json.path("error").asText("unknown"));
        }
        return json.path("access_token").asText();
    }

    private SlackIdentity fetchIdentity(String accessToken) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(USERINFO_URL))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode json = objectMapper.readTree(response.body());
        // ponytail: OIDC userInfo는 표준상 "ok" 래퍼가 없다(봇 Web API와 다름) — sub 유무로 성공 판단.
        String sub = json.path("sub").asText(null);
        if (sub == null || sub.isBlank()) {
            throw new IOException("슬랙 사용자 정보 조회 실패: " + json.path("error").asText("unknown"));
        }
        String teamId = json.path("https://slack.com/team_id").asText(null);
        String name = json.path("name").asText(null);
        return new SlackIdentity(sub, teamId, name);
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    public record SlackIdentity(String slackUserId, String slackTeamId, String displayName) {}
}
