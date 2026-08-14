package com.skalog.schedule;

import jakarta.persistence.*;

@Entity
@Table(name = "schedule_instructor")
public class ScheduleInstructor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InstructorRole role;

    protected ScheduleInstructor() {}

    public ScheduleInstructor(Schedule schedule, String name, InstructorRole role) {
        this.schedule = schedule;
        this.name = name;
        this.role = role;
    }

    public String getName() { return name; }
    public InstructorRole getRole() { return role; }
}
