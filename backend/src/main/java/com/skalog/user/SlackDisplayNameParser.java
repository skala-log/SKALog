package com.skalog.user;

/**
 * 슬랙 표시 이름("판교_1반_탁연우")에서 캠퍼스/반/이름을 뽑아낸다.
 * 반 선택 온보딩 화면 대신 이걸로 반을 자동으로 정한다.
 *
 * ponytail: 실제로는 "4기_판교_1반_김동현"처럼 기수 등 접두어가 더 붙는 경우가 있어서,
 * 맨 뒤 3파트(캠퍼스/반/이름)만 쓰고 앞의 나머지는 무시한다.
 */
public final class SlackDisplayNameParser {

    private SlackDisplayNameParser() {}

    public static ParsedSlackName parse(String displayName) {
        String[] parts = displayName == null ? new String[0] : displayName.trim().split("_");
        if (parts.length < 3) {
            throw new IllegalArgumentException(
                    "슬랙 표시 이름이 \"[…_]캠퍼스_반_이름\" 형식이 아닙니다: " + displayName);
        }
        String campus = parts[parts.length - 3];
        String className = parts[parts.length - 2];
        String personName = parts[parts.length - 1];
        if (campus.isBlank() || className.isBlank() || personName.isBlank()) {
            throw new IllegalArgumentException(
                    "슬랙 표시 이름이 \"[…_]캠퍼스_반_이름\" 형식이 아닙니다: " + displayName);
        }
        return new ParsedSlackName(campus, className, personName);
    }

    public record ParsedSlackName(String campus, String className, String personName) {}
}
