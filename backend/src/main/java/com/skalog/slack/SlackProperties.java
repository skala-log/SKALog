package com.skalog.slack;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "slack")
public record SlackProperties(String botToken, List<String> materialChannelIds) {
    public SlackProperties {
        materialChannelIds = materialChannelIds == null
                ? List.of()
                : materialChannelIds.stream().filter(s -> !s.isBlank()).toList();
    }
}
