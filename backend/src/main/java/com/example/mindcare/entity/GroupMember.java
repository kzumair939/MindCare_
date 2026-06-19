package com.example.mindcare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_members", uniqueConstraints = @UniqueConstraint(columnNames = {"room_id","user_id"}))
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GroupMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "room_id", nullable = false)
    private GroupRoom room;

    @ManyToOne @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime joinedAt;

    @PrePersist protected void onCreate() { joinedAt = LocalDateTime.now(); }
}
