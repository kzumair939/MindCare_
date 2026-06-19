package com.example.mindcare.entity;

import com.example.mindcare.Enum.Role;
import com.example.mindcare.Enum.TherapyType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    private Role role;

    // =============================
    // Profile fields
    // =============================
    private String displayName;
    private Integer age;
    private String phone;
    private String bio;

    // =============================
    // Survey & recommendation
    // =============================
    private LocalDateTime surveyCompletedAt;
    private String surveyCategory;

    @Enumerated(EnumType.STRING)
    private TherapyType recommendedTherapy;

    private boolean crisisFlag;

    // =============================
    // Anonymous & free sessions
    // =============================
    private boolean anonymousMode = false;
    private String anonymousAlias;
    private int freeSessionsUsed = 0;

    // =============================
    // Account status
    // =============================
    private boolean enabled = true;
    private boolean deleted = false;
    private boolean blocked = false;
    private String profilePicturePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
