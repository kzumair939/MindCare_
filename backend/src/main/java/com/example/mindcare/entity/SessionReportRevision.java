package com.example.mindcare.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Immutable snapshot of a SessionReport at the time it was saved.
 * Used to keep edit history (audit trail) for therapists.
 */
@Entity
@Table(name = "session_report_revisions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionReportRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private SessionReport report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
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

    private Integer progressRating;

    @Column(length = 2000)
    private String nextSteps;

    @Column(length = 2000)
    private String clientSummary;

    @Column(length = 4000)
    private String privateNotes;

    @Column(length = 2000)
    private String homeworkExercises;

    private boolean sharedWithClient = false;

    private LocalDateTime savedAt;
}
