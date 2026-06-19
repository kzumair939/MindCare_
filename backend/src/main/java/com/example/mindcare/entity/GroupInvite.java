package com.example.mindcare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_invites")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GroupInvite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "room_id", nullable = false)
    private GroupRoom room;

    private String invitedEmail;
    private String token;          // unique UUID for email link
    private boolean used = false;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
}
