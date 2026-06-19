package com.example.mindcare.entity;

import com.example.mindcare.Enum.TherapyType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "survey_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    // 10 answers (0-3 scale)
    private Integer q1;
    private Integer q2;
    private Integer q3;
    private Integer q4;
    private Integer q5;
    private Integer q6;
    private Integer q7;
    private Integer q8;
    private Integer q9;
    private Integer q10;

    private String category;

    @Enumerated(EnumType.STRING)
    private TherapyType recommendedTherapy;

    private boolean crisisFlag;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
