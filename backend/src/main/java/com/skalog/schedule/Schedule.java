package com.skalog.schedule;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

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

    @Column(length = 100)
    private String instructor;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Schedule() {}

    public void update(String subject, String instructor) {
        this.subject = subject;
        this.instructor = instructor;
    }

    public Long getId() { return id; }
    public Long getClassId() { return classId; }
    public LocalDate getDate() { return date; }
    public int getWeekNo() { return weekNo; }
    public String getSubject() { return subject; }
    public String getInstructor() { return instructor; }
}
