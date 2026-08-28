package com.skalog.slack;

import java.util.List;

/** 슬랙 conversations.history 응답 메시지에서 필요한 필드만 뽑은 것. */
public record SlackMessage(String ts, String text, List<SlackFile> files) {
    public record SlackFile(String id, String name, String urlPrivate, String filetype, String permalink) {}
}
