package com.skalog.user;

/**
 * 슬랙 표시 이름("판교_1반_탁연우")에서 캠퍼스/반/이름을 뽑아낸다.
 * 반 선택 온보딩 화면 대신 이걸로 반을 자동으로 정한다.
 */
public final class SlackDisplayNameParser {

    private SlackDisplayNameParser() {}

    public static ParsedSlackName parse(String displayName) {
        String[] parts = displayName == null ? new String[0] : displayName.trim().split("_");
        if (parts.length != 3 || parts[0].isBlank() || parts[1].isBlank() || parts[2].isBlank()) {
            throw new IllegalArgumentException(
                    "슬랙 표시 이름이 \"캠퍼스_반_이름\" 형식이 아닙니다: " + displayName);
        }
        return new ParsedSlackName(parts[0], parts[1], parts[2]);
    }

    public record ParsedSlackName(String campus, String className, String personName) {}
}
