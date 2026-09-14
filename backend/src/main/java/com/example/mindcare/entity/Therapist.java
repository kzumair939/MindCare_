package com.example.mindcare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "therapists")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Therapist {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;

    @Column(length = 500)
    private String specialization;

    @Column(columnDefinition = "TEXT")
    private String specialties;

    @Column(columnDefinition = "TEXT")
    private String languages;

    private Integer sessionPrice;

    @Column(columnDefinition = "TEXT")
    private String availableDays;

    @Column(length = 200)
    private String availableTimeStart;

    @Column(length = 200)
    private String availableTimeEnd;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_account_id")
    private User userAccount;

    private boolean active = true;
    private boolean senior = false;

    private boolean verified = false;

    @Column(columnDefinition = "TEXT")
    private String qualificationFilePath;

    private LocalDateTime verificationRequestedAt;
    private LocalDateTime verifiedAt;

    @Column(columnDefinition = "TEXT")
    private String profilePicturePath;
}
