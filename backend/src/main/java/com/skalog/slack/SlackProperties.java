package com.skalog.slack;

import com.skalog.notice.NoticeScope;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "slack")
public record SlackProperties(
        String clientId,
        String clientSecret,
        String botToken,
        String teamId,
        List<String> materialChannelIds,
        List<NoticeChannel> noticeChannels,
        String redirectBaseUri) {
    public SlackProperties {
        materialChannelIds = materialChannelIds == null
                ? List.of()
                : materialChannelIds.stream().filter(s -> !s.isBlank()).toList();
        noticeChannels = noticeChannels == null ? List.of() : noticeChannels;
    }

    /**
     * 공지 채널과 그 채널 공지의 노출 범위 매핑. yml에는 공용 채널(층·캠퍼스)만 두고 classId는 비워둔다.
     * 반 채널은 class_group.slack_channel_id에서 와서 classId·campus가 채워진다 — 그 반에게만 보인다.
     * campus는 class_group.campus 와 같은 "판교 4층" 형식. FLOOR 채널은 반드시 있어야 하고, CAMPUS(모두)면 비운다.
     * since(선택, "2026-08-01" 또는 "2026-08-01T09:00:00+09:00")가 있으면 그 이전 메시지는 보지 않는다.
     */
    public record NoticeChannel(
            String channelId, NoticeScope scope, String label, Long classId, String campus, String since) {
        private static final ZoneId KST = ZoneId.of("Asia/Seoul");

        public Instant sinceInstant() {
            if (since == null || since.isBlank()) return null;
            return since.length() <= 10
                    ? LocalDate.parse(since).atStartOfDay(KST).toInstant()
                    : OffsetDateTime.parse(since).toInstant();
        }
    }
}
