package com.skalog.notice;

/** 공지 노출 범위 — 프론트 NoticeScope 배지 색과 1:1 대응. 선언 순서가 곧 넓이(뒤로 갈수록 넓다). */
public enum NoticeScope {
    CLASS,
    FLOOR,
    CAMPUS;

    public boolean isWiderThan(NoticeScope other) {
        return ordinal() > other.ordinal();
    }
}
