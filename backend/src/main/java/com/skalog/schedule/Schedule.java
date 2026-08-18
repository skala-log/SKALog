package com.skalog.schedule;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedule")
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "week_no", nullable = false)
    private int weekNo;

    @Column(nullable = false, length = 200)
    private String subject;

    /** 직강 여부 — 반별 시간표상 흰 배경+볼드(현장에서 직접 강의)인지, 그 외(다른 반 강의를 중계로 시청)인지. */
    @Column(name = "is_live", nullable = false)
    private boolean isLive;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ScheduleInstructor> instructors = new ArrayList<>();

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Schedule() {}

    public void update(String subject, List<ScheduleInstructor> newInstructors) {
        this.subject = subject;
        this.instructors.clear();
        this.instructors.addAll(newInstructors);
    }

    public Long getId() { return id; }
    public Long getClassId() { return classId; }
    public LocalDate getDate() { return date; }
    public int getWeekNo() { return weekNo; }
    public String getSubject() { return subject; }
    public List<ScheduleInstructor> getInstructors() { return instructors; }

    @JsonProperty("isLive")
    public boolean isLive() { return isLive; }
}
