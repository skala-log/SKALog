package com.skalog.user;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/** 반. Java 의 Class 와 이름이 겹쳐 ClassGroup 으로 둔다. */
@Entity
@Table(name = "class_group")
public class ClassGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 50)
    private String campus;

    /** 반별 슬랙 교육 채널. 비공개 채널이라 봇을 초대받은 반만 채워진다. null이면 공지 수집 안 함. */
    @Column(name = "slack_channel_id", length = 20, unique = true)
    private String slackChannelId;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected ClassGroup() {}

    public ClassGroup(String campus, String name) {
        this.campus = campus;
        this.name = name;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCampus() { return campus; }
    public String getSlackChannelId() { return slackChannelId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
