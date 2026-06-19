package com.example.mindcare.entity;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.Enum.TherapyType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "sessions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"therapist_id", "session_date", "session_time", "status"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "therapist_id")
    private Therapist therapist;

    private LocalDate sessionDate;

    private LocalTime sessionTime;

    private String sessionType;

    @Enumerated(EnumType.STRING)
    private TherapyType therapyType;

    private Integer feeAmount;

    private boolean priority;

    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "VARCHAR(50) NOT NULL DEFAULT 'BOOKED'")
    private AppointmentStatus status = AppointmentStatus.BOOKED;

    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
}