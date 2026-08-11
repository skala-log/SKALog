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

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Material() {}

    /** 4단계 슬랙 수집기 전까지는 수동 입력이라 승인 큐 없이 바로 APPROVED로 붙는다. */
    public Material(Long scheduleId, String title, MaterialKind kind, String url) {
        this.scheduleId = scheduleId;
        this.title = title;
        this.kind = kind;
        this.url = url;
        this.status = MaterialStatus.APPROVED;
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
}
