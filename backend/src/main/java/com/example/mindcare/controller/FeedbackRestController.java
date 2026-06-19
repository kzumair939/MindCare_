package com.example.mindcare.controller;

import com.example.mindcare.dto.FeedbackFormDto;
import com.example.mindcare.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackRestController {
    private final FeedbackService feedbackService;

    @PostMapping("/{sessionId}")
    public ResponseEntity<?> submit(@PathVariable Long sessionId, @RequestBody FeedbackFormDto dto, Authentication auth) {
        try {
            feedbackService.submit(auth.getName(), sessionId, dto);
            return ResponseEntity.ok(Map.of("message","Feedback submitted"));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error",e.getMessage())); }
    }

    @PostMapping("/{sessionId}/skip")
    public ResponseEntity<?> skip(@PathVariable Long sessionId, Authentication auth) {
        feedbackService.skip(auth.getName(), sessionId);
        return ResponseEntity.ok(Map.of("message","Skipped"));
    }
}
