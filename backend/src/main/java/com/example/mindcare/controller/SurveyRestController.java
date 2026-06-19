package com.example.mindcare.controller;

import com.example.mindcare.dto.SurveyFormDto;
import com.example.mindcare.entity.SurveyResult;
import com.example.mindcare.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/survey")
@RequiredArgsConstructor
public class SurveyRestController {
    private final SurveyService surveyService;

    @GetMapping
    public ResponseEntity<?> get(Authentication auth) {
        SurveyResult r = surveyService.getForUser(auth.getName());
        if (r == null) return ResponseEntity.ok(Map.of("completed", false));
        return ResponseEntity.ok(Map.of("completed",true,
            "category", r.getCategory() != null ? r.getCategory() : "",
            "recommendedTherapy", r.getRecommendedTherapy() != null ? r.getRecommendedTherapy().name() : ""));
    }

    @PostMapping
    public ResponseEntity<?> submit(@RequestBody SurveyFormDto dto, Authentication auth) {
        SurveyResult r = surveyService.saveForUser(auth.getName(), dto);
        return ResponseEntity.ok(Map.of(
            "category", r.getCategory() != null ? r.getCategory() : "",
            "recommendedTherapy", r.getRecommendedTherapy() != null ? r.getRecommendedTherapy().name() : "",
            "crisisFlag", r.isCrisisFlag()
        ));
    }
}
