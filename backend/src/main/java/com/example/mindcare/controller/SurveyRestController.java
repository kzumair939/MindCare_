package com.example.mindcare.controller;

import com.example.mindcare.dto.AiSurveyAnswerItemDto;
import com.example.mindcare.dto.AiSurveyStepDto;
import com.example.mindcare.dto.SurveyFormDto;
import com.example.mindcare.entity.SurveyResult;
import com.example.mindcare.service.AiTherapyAdvisorService;
import com.example.mindcare.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/survey")
@RequiredArgsConstructor
public class SurveyRestController {
    private final SurveyService surveyService;
    private final AiTherapyAdvisorService aiTherapyAdvisorService;

    @GetMapping
    public ResponseEntity<?> get(Authentication auth) {
        SurveyResult r = surveyService.getForUser(auth.getName());
        if (r == null) return ResponseEntity.ok(Map.of("completed", false));
        return ResponseEntity.ok(Map.of(
            "completed", true,
            "category", r.getCategory() != null ? r.getCategory() : "",
            "recommendedTherapy", r.getRecommendedTherapy() != null ? r.getRecommendedTherapy().name() : "",
            "aiAnalysis", r.getAiAnalysis() != null ? r.getAiAnalysis() : "",
            "actionPlan", r.getActionPlan() != null ? r.getActionPlan() : "[]",
            "stressScore", r.getStressScore() != null ? r.getStressScore() : 75,
            "crisisFlag", r.isCrisisFlag()
        ));
    }

    @PostMapping
    public ResponseEntity<?> submit(@RequestBody SurveyFormDto dto, Authentication auth) {
        SurveyResult r = surveyService.saveForUser(auth.getName(), dto);
        return ResponseEntity.ok(Map.of(
            "completed", true,
            "category", r.getCategory() != null ? r.getCategory() : "",
            "recommendedTherapy", r.getRecommendedTherapy() != null ? r.getRecommendedTherapy().name() : "",
            "aiAnalysis", r.getAiAnalysis() != null ? r.getAiAnalysis() : "",
            "actionPlan", r.getActionPlan() != null ? r.getActionPlan() : "[]",
            "stressScore", r.getStressScore() != null ? r.getStressScore() : 75,
            "crisisFlag", r.isCrisisFlag()
        ));
    }

    @PostMapping("/interactive/start")
    public ResponseEntity<AiSurveyStepDto> startInteractiveAssessment() {
        AiSurveyStepDto firstStep = aiTherapyAdvisorService.startInteractiveAssessment();
        return ResponseEntity.ok(firstStep);
    }

    @PostMapping("/interactive/next")
    public ResponseEntity<AiSurveyStepDto> processInteractiveStep(
            @RequestBody List<AiSurveyAnswerItemDto> history,
            Authentication auth
    ) {
        AiSurveyStepDto step = aiTherapyAdvisorService.processNextStep(history);

        // If the AI assessment has concluded, persist the recommendation to the user profile
        if (step.isCompleted() && step.getFinalRecommendation() != null && auth != null) {
            surveyService.saveInteractiveResultForUser(auth.getName(), step.getFinalRecommendation());
        }

        return ResponseEntity.ok(step);
    }
}
