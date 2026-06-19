package com.example.mindcare.controller;

import com.example.mindcare.dto.ReportFormDto;
import com.example.mindcare.entity.SessionReport;
import com.example.mindcare.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/report")
@RequiredArgsConstructor
public class ReportRestController {
    private final ReportService reportService;

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getReport(@PathVariable Long sessionId, Authentication auth) {
        try {
            SessionReport r = reportService.getOrCreateForSession(sessionId, auth.getName());
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("symptomsSummary", r.getSymptomsSummary());
            map.put("sessionGoals", r.getSessionGoals());
            map.put("progressRating", r.getProgressRating());
            map.put("nextSteps", r.getNextSteps());
            map.put("clientSummary", r.getClientSummary());
            map.put("privateNotes", r.getPrivateNotes());
            map.put("homeworkExercises", r.getHomeworkExercises());
            map.put("sharedWithClient", r.isSharedWithClient());
            map.put("createdAt", r.getCreatedAt());
            map.put("updatedAt", r.getUpdatedAt());
            return ResponseEntity.ok(map);
        } catch (Exception e) { 
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); 
        }
    }

    @PostMapping("/session/{sessionId}")
    public ResponseEntity<?> saveReport(@PathVariable Long sessionId, @RequestBody ReportFormDto dto, Authentication auth) {
        reportService.saveForSession(sessionId, auth.getName(), dto);
        return ResponseEntity.ok(Map.of("message", "Report saved successfully"));
    }

    @GetMapping("/user/session/{sessionId}")
    public ResponseEntity<?> getUserReport(@PathVariable Long sessionId, Authentication auth) {
        try {
            SessionReport r = reportService.getReportForUser(sessionId, auth.getName());
            if (r == null) {
                return ResponseEntity.ok().build();
            }
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("symptomsSummary", r.getSymptomsSummary());
            map.put("sessionGoals", r.getSessionGoals());
            map.put("progressRating", r.getProgressRating());
            map.put("nextSteps", r.getNextSteps());
            map.put("clientSummary", r.getClientSummary());
            map.put("homeworkExercises", r.getHomeworkExercises());
            map.put("sharedWithClient", r.isSharedWithClient());
            map.put("createdAt", r.getCreatedAt());
            map.put("updatedAt", r.getUpdatedAt());
            return ResponseEntity.ok(map);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
