package com.example.mindcare.controller;

import com.example.mindcare.entity.User;
import com.example.mindcare.service.NotificationService;
import com.example.mindcare.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationRestController {
    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getAll(Authentication auth) {
        User u = userService.findByIdentifier(auth.getName()).orElseThrow();
        return ResponseEntity.ok(notificationService.getAll(u));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication auth) {
        User u = userService.findByIdentifier(auth.getName()).orElseThrow();
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(u)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok(Map.of("message","Marked read"));
    }
}
