package com.example.mindcare.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "room_id")
    private GroupRoom room;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    @Column(length = 5000)
    private String content;

    private boolean anonymous;
    private String anonymousAlias;
    private boolean reported = false;
    private String reportReason;
    private boolean edited = false;
    private boolean deleted = false;
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
}
