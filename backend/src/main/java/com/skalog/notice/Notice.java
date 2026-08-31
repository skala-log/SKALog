package com.skalog.notice;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/** 슬랙 공지 채널 메시지를 LLM으로 한 줄 요약한 것. title이 곧 요약문이다. */
@Entity
@Table(name = "notice")
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoticeScope scope;

    @Column(name = "scope_label", nullable = false, length = 50)
    private String scopeLabel;

    /** 반 채널 공지는 그 반에게만 보인다. null이면 층 또는 전체 공개. */
    @Column(name = "class_id")
    private Long classId;

    /** class_group.campus 와 같은 "판교 4층" 형식. CLASS면 그 반의 층, FLOOR면 그 층, CAMPUS(모두)면 null. */
    @Column(length = 50)
    private String campus;

    /** 슬랙에 실제로 올라온 시각(메시지 ts). */
    @Column(name = "posted_at", nullable = false)
    private OffsetDateTime postedAt;

    /** 슬랙 원본 메시지 permalink. 조회 실패 시 null. */
    @Column(columnDefinition = "text")
    private String url;

    /** 채널ID:ts. 재수집 시 중복 삽입을 막는다. */
    @Column(name = "source_ref", nullable = false, length = 200, unique = true)
    private String sourceRef;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Notice() {}

    public Notice(
            String title,
            NoticeScope scope,
            String scopeLabel,
            Long classId,
            String campus,
            OffsetDateTime postedAt,
            String url,
            String sourceRef) {
        this.title = title;
        this.scope = scope;
        this.scopeLabel = scopeLabel;
        this.classId = classId;
        this.campus = campus;
        this.postedAt = postedAt;
        this.url = url;
        this.sourceRef = sourceRef;
    }

    /** 같은 내용이 더 넓은 채널에도 올라왔을 때 — 좁은 범위(반)로 저장된 걸 넓은 범위로 올린다. */
    public void widenTo(NoticeScope scope, String scopeLabel, Long classId, String campus) {
        this.scope = scope;
        this.scopeLabel = scopeLabel;
        this.classId = classId;
        this.campus = campus;
    }

    public Long getId() { return id; }
    public String getCampus() { return campus; }
    public String getTitle() { return title; }
    public NoticeScope getScope() { return scope; }
    public String getScopeLabel() { return scopeLabel; }
    public Long getClassId() { return classId; }
    public OffsetDateTime getPostedAt() { return postedAt; }
    public String getUrl() { return url; }
    public String getSourceRef() { return sourceRef; }
}
