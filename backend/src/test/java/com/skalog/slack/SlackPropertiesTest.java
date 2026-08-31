package com.skalog.slack;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.skalog.notice.NoticeScope;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class SlackPropertiesTest {

    private static SlackProperties.NoticeChannel channel(String since) {
        return new SlackProperties.NoticeChannel("C1", NoticeScope.FLOOR, "4층", null, "판교 4층", since);
    }

    @Test
    void since는_날짜만_써도_KST_자정으로_읽는다() {
        assertEquals(Instant.parse("2026-07-31T15:00:00Z"), channel("2026-08-01").sinceInstant());
        assertEquals(Instant.parse("2026-08-31T07:20:00Z"), channel("2026-08-31T16:20:00+09:00").sinceInstant());
        assertNull(channel(null).sinceInstant());
        assertNull(channel("").sinceInstant());
    }
}
