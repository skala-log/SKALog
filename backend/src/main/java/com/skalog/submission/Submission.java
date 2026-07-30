package com.skalog.submission;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "submission")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 분류를 사용자에게 시키지 않기 위해 반드시 일정에 붙는다. */
    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubmissionType type;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    @Column(name = "file_key", columnDefinition = "text")
    private String fileKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Visibility visibility = Visibility.PRIVATE;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    protected Submission() {}

    public Submission(Long userId, Long scheduleId, SubmissionType type, String title, String body) {
        this.userId = userId;
        this.scheduleId = scheduleId;
        this.type = type;
        this.title = title;
        this.body = body;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getScheduleId() { return scheduleId; }
    public SubmissionType getType() { return type; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public Visibility getVisibility() { return visibility; }
    public boolean isDeleted() { return deletedAt != null; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
