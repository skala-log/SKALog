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

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected ClassGroup() {}

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCampus() { return campus; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
