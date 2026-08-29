package com.skalog.material;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "material")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(nullable = false, length = 300)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MaterialKind kind;

    @Column(columnDefinition = "text")
    private String url;

    @Column(name = "file_key", columnDefinition = "text")
    private String fileKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MaterialStatus status = MaterialStatus.PENDING;

    /** 슬랙 원본 식별자. 재수집 시 중복 삽입을 막는다. */
    @Column(name = "source_ref", length = 200, unique = true)
    private String sourceRef;

    /** 슬랙에 실제로 올라온 시각(메시지 ts) — DB insert 시각인 createdAt과는 다르다. */
    @Column(name = "posted_at")
    private OffsetDateTime postedAt;

    /** 원본 파일/링크(url)와 별개로, 클릭하면 슬랙 메시지로 이동하는 permalink. */
    @Column(name = "source_url", columnDefinition = "text")
    private String sourceUrl;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Material() {}

    /** 관리자 수동 입력 — 승인 큐 없이 바로 APPROVED로 붙는다. postedAt은 등록 시각. */
    public Material(Long scheduleId, String title, MaterialKind kind, String url) {
        this.scheduleId = scheduleId;
        this.title = title;
        this.kind = kind;
        this.url = url;
        this.status = MaterialStatus.APPROVED;
        this.postedAt = OffsetDateTime.now();
    }

    /** 슬랙 수집기 — 사람이 확인 전이라 PENDING(기본값)으로 시작해 승인함에 뜬다. */
    public Material(
            Long scheduleId,
            String title,
            MaterialKind kind,
            String url,
            String sourceRef,
            OffsetDateTime postedAt,
            String sourceUrl) {
        this.scheduleId = scheduleId;
        this.title = title;
        this.kind = kind;
        this.url = url;
        this.sourceRef = sourceRef;
        this.postedAt = postedAt;
        this.sourceUrl = sourceUrl;
    }

    public void approve() {
        this.status = MaterialStatus.APPROVED;
    }

    public void reject() {
        this.status = MaterialStatus.REJECTED;
    }

    public void relink(Long scheduleId) {
        this.scheduleId = scheduleId;
    }

    public Long getId() { return id; }
    public Long getScheduleId() { return scheduleId; }
    public String getTitle() { return title; }
    public MaterialKind getKind() { return kind; }
    public String getUrl() { return url; }
    public String getFileKey() { return fileKey; }
    public MaterialStatus getStatus() { return status; }
    public String getSourceRef() { return sourceRef; }
    public OffsetDateTime getPostedAt() { return postedAt; }
    public String getSourceUrl() { return sourceUrl; }
}
