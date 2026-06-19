package com.example.mindcare.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "session_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", unique = true, nullable = false)
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "therapist_id", nullable = false)
    private Therapist therapist;

    @Column(length = 2000)
    private String symptomsSummary;

    @Column(length = 2000)
    private String sessionGoals;

    /** 1-5 (optional) */
    private Integer progressRating;

    @Column(length = 2000)
    private String nextSteps;

    /**
     * Optional client-friendly summary that the USER can view.
     * Keep this non-technical and supportive.
     */
    @Column(length = 2000)
    private String clientSummary;

    @Column(length = 4000)
    private String privateNotes;

    @Column(length = 2000)
    private String homeworkExercises;

    private boolean sharedWithClient = false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
