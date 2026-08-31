package com.skalog.slack;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/** 슬랙 Web API 최소 클라이언트. conversations.history만 호출한다. */
@Component
public class SlackClient {

    private static final String API_BASE = "https://slack.com/api";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SlackProperties properties;

    public SlackClient(SlackProperties properties) {
        this.properties = properties;
    }

    public List<SlackMessage> history(String channelId) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + "/conversations.history?channel=" + channelId + "&limit=200"))
                .header("Authorization", "Bearer " + properties.botToken())
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode root = objectMapper.readTree(response.body());
        if (!root.path("ok").asBoolean(false)) {
            throw new IOException("슬랙 API 오류: " + root.path("error").asText("unknown"));
        }

        List<SlackMessage> messages = new ArrayList<>();
        for (JsonNode m : root.path("messages")) {
            List<SlackMessage.SlackFile> files = new ArrayList<>();
            for (JsonNode f : m.path("files")) {
                files.add(new SlackMessage.SlackFile(
                        f.path("id").asText(null),
                        f.path("name").asText(null),
                        f.path("url_private").asText(null),
                        f.path("filetype").asText(null),
                        f.path("permalink").asText(null)));
            }
            // 슬랙 "공유"로 넘어온 원문은 text가 아니라 attachments(is_share)에 들어온다. 링크 미리보기(unfurl)는 제외.
            StringBuilder text = new StringBuilder(m.path("text").asText(""));
            for (JsonNode a : m.path("attachments")) {
                String shared = a.path("text").asText("");
                if (a.path("is_share").asBoolean(false) && !shared.isBlank()) {
                    text.append('\n').append(shared);
                }
            }
            messages.add(new SlackMessage(m.path("ts").asText(null), text.toString().strip(), files));
        }
        return messages;
    }

    /** 순수 텍스트 메시지는 슬랙이 permalink를 내려주지 않아서 chat.getPermalink로 따로 조회한다. */
    public String getPermalink(String channelId, String ts) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + "/chat.getPermalink?channel=" + channelId + "&message_ts=" + ts))
                .header("Authorization", "Bearer " + properties.botToken())
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode root = objectMapper.readTree(response.body());
        if (!root.path("ok").asBoolean(false)) {
            throw new IOException("슬랙 API 오류: " + root.path("error").asText("unknown"));
        }
        return root.path("permalink").asText(null);
    }
}
