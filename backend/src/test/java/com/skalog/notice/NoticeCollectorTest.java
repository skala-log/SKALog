package com.skalog.notice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class NoticeCollectorTest {

    @Test
    void 슬랙_마크업을_걷어낸다() {
        String raw = "<!here> <@U0ABC> 서베이 <https://forms.gle/x|forms.gle/…> 참여, Zoom <tel:8641925383|864 192 5383> 참고 <https://work24.go.kr>";
        assertEquals(
                "서베이 forms.gle/… 참여, Zoom 864 192 5383 참고 https://work24.go.kr",
                NoticeCollector.cleanSlackMarkup(raw));
    }

    @Test
    void 중복_안전망은_날짜_차수_층이_하나도_안_겹치면_거부한다() {
        // 같은 종류의 다른 공지 — 모델이 DUP라 해도 막아야 하는 것들
        assertFalse(NoticeCollector.sharesDateTokens(
                "8/24(월)~8/28(금) 주간은 아래와 같이 식사합니다", "8/31~9/4 점심: 4층 11:50 3반→1,2반→4,5반"));
        assertFalse(NoticeCollector.sharesDateTokens(
                "판교 5층 취업캠프가 8/25(화) 진행됩니다", "9/7(월) 판교4층 취업캠프 — 자소서 파일 준비"));
        assertFalse(NoticeCollector.sharesDateTokens(
                "2차 단위기간(8/14~9/13) 출결현황", "1차 단위기간(7/14~8/13) 출결현황을 고용24에서 확인"));
    }

    @Test
    void 독자_포함_관계_모두는_층을_층은_같은_층의_반을_포함한다() {
        // 전체 공지는 누구든 이미 보고 있다
        assertTrue(NoticeCollector.covers(NoticeScope.CAMPUS, null, null, NoticeScope.CLASS, 7L, "판교 5층"));
        // 4층 공지는 4층 반은 포함하지만 5층 반·전체는 포함하지 않는다
        assertTrue(NoticeCollector.covers(NoticeScope.FLOOR, null, "판교 4층", NoticeScope.CLASS, 1L, "판교 4층"));
        assertFalse(NoticeCollector.covers(NoticeScope.FLOOR, null, "판교 4층", NoticeScope.CLASS, 7L, "판교 5층"));
        assertFalse(NoticeCollector.covers(NoticeScope.FLOOR, null, "판교 4층", NoticeScope.CAMPUS, null, null));
        // 1반 공지는 1반만 — 2반 채널에 재게시되면 2반용으로 따로 저장돼야 한다
        assertTrue(NoticeCollector.covers(NoticeScope.CLASS, 1L, "판교 4층", NoticeScope.CLASS, 1L, "판교 4층"));
        assertFalse(NoticeCollector.covers(NoticeScope.CLASS, 1L, "판교 4층", NoticeScope.CLASS, 2L, "판교 4층"));
        assertFalse(NoticeCollector.covers(NoticeScope.CLASS, 1L, "판교 4층", NoticeScope.FLOOR, null, "판교 4층"));
    }

    @Test
    void 중복_안전망은_토큰이_겹치거나_없으면_모델_판단을_따른다() {
        // "8월 19일" 표기와 "8/19" 표기를 같은 날짜로 본다
        assertTrue(NoticeCollector.sharesDateTokens(
                "제출 기한 2026년 8월 19일(수) 23:59까지", "8/19(수) 23:59까지 구글폼 2개 모두 필수 제출"));
        // 한쪽에 날짜가 없으면(재게시 독촉 등) 판단은 모델 몫
        assertTrue(NoticeCollector.sharesDateTokens(
                "Vue.js 서베이 아직 안 하신 분들 꼭 해주세요!", "Vue.js 교과목 종료 서베이 참여 요망"));
    }
}
