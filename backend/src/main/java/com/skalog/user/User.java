package com.skalog.user;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slack_user_id", nullable = false, unique = true, length = 50)
    private String slackUserId;

    @Column(name = "slack_team_id", nullable = false, length = 50)
    private String slackTeamId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "class_id")
    private Long classId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.STUDENT;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected User() {}

    public User(String slackUserId, String slackTeamId, String name, Long classId) {
        this.slackUserId = slackUserId;
        this.slackTeamId = slackTeamId;
        this.name = name;
        this.classId = classId;
    }

    public Long getId() { return id; }
    public String getSlackUserId() { return slackUserId; }
    public String getSlackTeamId() { return slackTeamId; }
    public String getName() { return name; }
    public Long getClassId() { return classId; }
    public Role getRole() { return role; }
    public boolean isAdmin() { return role == Role.ADMIN; }
}
