package com.gitproof.user;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /** 지원자의 등록된 GitHub username (면접관은 null 가능). */
    private String githubUsername;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected User() {}

    public User(String email, String passwordHash, String name, Role role, String githubUsername) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.role = role;
        this.githubUsername = githubUsername;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getName() { return name; }
    public Role getRole() { return role; }
    public String getGithubUsername() { return githubUsername; }
    public Instant getCreatedAt() { return createdAt; }

    public void setName(String name) { this.name = name; }
    public void setGithubUsername(String githubUsername) { this.githubUsername = githubUsername; }
}
