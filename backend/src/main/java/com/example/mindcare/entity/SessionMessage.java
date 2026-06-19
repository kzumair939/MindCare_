package com.example.mindcare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "session_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    private String senderName;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime sentAt;
}
