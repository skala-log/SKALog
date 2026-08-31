package com.skalog.slack;

import com.skalog.notice.NoticeCollector;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@EnableConfigurationProperties(SlackProperties.class)
public class CollectorScheduleConfig {

    private final MaterialCollector materialCollector;
    private final NoticeCollector noticeCollector;

    public CollectorScheduleConfig(MaterialCollector materialCollector, NoticeCollector noticeCollector) {
        this.materialCollector = materialCollector;
        this.noticeCollector = noticeCollector;
    }

    // ponytail: initialDelay를 안 둬서 서버가 (재)기동되는 즉시 첫 수집이 돈다.
    // 슬립에서 깨어난 직후에도 밀린 자료를 바로 잡기 위함 — docs/slack-collector-decision.md 참고.
    @Scheduled(fixedDelay = 10 * 60 * 1000)
    public void collect() {
        materialCollector.collect();
        noticeCollector.collect();
    }
}
