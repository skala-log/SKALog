package com.skalog.slack;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "slack")
public record SlackProperties(
        String clientId,
        String clientSecret,
        String botToken,
        String teamId,
        List<String> materialChannelIds,
        String redirectBaseUri) {
    public SlackProperties {
        materialChannelIds = materialChannelIds == null
                ? List.of()
                : materialChannelIds.stream().filter(s -> !s.isBlank()).toList();
    }
}
