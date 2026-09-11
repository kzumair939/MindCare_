package com.example.mindcare.service.impl;

import com.example.mindcare.Enum.TherapyType;
import com.example.mindcare.dto.SurveyFormDto;
import com.example.mindcare.entity.SurveyResult;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.SurveyResultRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SurveyServiceImpl implements SurveyService {

    private final SurveyResultRepository surveyResultRepository;
    private final UserRepository userRepository;
    private final com.example.mindcare.service.AiTherapyAdvisorService aiTherapyAdvisorService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Override
    @Cacheable(value = "surveyResult", key = "#identifier")
    public SurveyResult getForUser(String identifier) {
        User user = findUser(identifier);
        return surveyResultRepository.findByUser_Id(user.getId()).orElse(null);
    }

    /**
     * Saves the survey result and immediately refreshes the cache entry for this user
     * via @CachePut — no eviction/re-fetch round-trip needed on the next read.
     */
    @Override
    @CachePut(value = "surveyResult", key = "#identifier")
    public SurveyResult saveForUser(String identifier, SurveyFormDto form) {
        User user = findUser(identifier);

        // Normalize answers 1-5
        int q1 = n(form.getQ1());
        int q2 = n(form.getQ2());
        int q3 = n(form.getQ3());
        int q4 = n(form.getQ4());
        int q5 = n(form.getQ5());
        int q6 = n(form.getQ6());
        int q7 = n(form.getQ7());
        int q8 = n(form.getQ8());
        int q9 = n(form.getQ9());
        int q10 = n(form.getQ10());

        // Run AI / Gemini analysis for clinically tailored recommendation
        com.example.mindcare.dto.AiTherapyRecommendationDto aiRec = aiTherapyAdvisorService.analyzeSurveyAndRecommend(form);

        String category = (aiRec != null && aiRec.getCategory() != null) ? aiRec.getCategory() : "General Wellbeing";
        TherapyType therapy = (aiRec != null && aiRec.getRecommendedTherapy() != null) ? aiRec.getRecommendedTherapy() : TherapyType.GENERAL_COUNSELLING;
        boolean crisis = (aiRec != null) ? aiRec.isCrisisFlag() : (q9 >= 2 || q10 >= 5);
        String aiAnalysis = (aiRec != null) ? aiRec.getAiAnalysis() : "";
        Integer stressScore = (aiRec != null) ? aiRec.getStressScore() : 75;

        String actionPlanJson = "";
        if (aiRec != null && aiRec.getActionPlan() != null) {
            try {
                actionPlanJson = objectMapper.writeValueAsString(aiRec.getActionPlan());
            } catch (Exception e) {
                actionPlanJson = "[]";
            }
        }

        SurveyResult existing = surveyResultRepository.findByUser_Id(user.getId()).orElse(null);
        LocalDateTime now = LocalDateTime.now();
        SurveyResult toSave = (existing != null) ? existing : new SurveyResult();
        toSave.setUser(user);
        toSave.setQ1(q1);
        toSave.setQ2(q2);
        toSave.setQ3(q3);
        toSave.setQ4(q4);
        toSave.setQ5(q5);
        toSave.setQ6(q6);
        toSave.setQ7(q7);
        toSave.setQ8(q8);
        toSave.setQ9(q9);
        toSave.setQ10(q10);
        toSave.setCategory(category);
        toSave.setRecommendedTherapy(therapy);
        toSave.setCrisisFlag(crisis);
        toSave.setAiAnalysis(aiAnalysis);
        toSave.setActionPlan(actionPlanJson);
        toSave.setStressScore(stressScore);
        if (toSave.getCreatedAt() == null) toSave.setCreatedAt(now);
        toSave.setUpdatedAt(now);

        SurveyResult saved = surveyResultRepository.save(toSave);

        // Store summary on User for easy dashboard access
        user.setSurveyCompletedAt(now);
        user.setSurveyCategory(category);
        user.setRecommendedTherapy(therapy);
        user.setCrisisFlag(crisis);
        userRepository.save(user);

        return saved;
    }

    @Override
    @CachePut(value = "surveyResult", key = "#identifier")
    public SurveyResult saveInteractiveResultForUser(String identifier, com.example.mindcare.dto.AiTherapyRecommendationDto aiRec) {
        User user = findUser(identifier);

        String category = (aiRec != null && aiRec.getCategory() != null) ? aiRec.getCategory() : "General Wellbeing";
        TherapyType therapy = (aiRec != null && aiRec.getRecommendedTherapy() != null) ? aiRec.getRecommendedTherapy() : TherapyType.GENERAL_COUNSELLING;
        boolean crisis = (aiRec != null) && aiRec.isCrisisFlag();
        String aiAnalysis = (aiRec != null) ? aiRec.getAiAnalysis() : "";
        Integer stressScore = (aiRec != null && aiRec.getStressScore() != null) ? aiRec.getStressScore() : 75;

        String actionPlanJson = "";
        if (aiRec != null && aiRec.getActionPlan() != null) {
            try {
                actionPlanJson = objectMapper.writeValueAsString(aiRec.getActionPlan());
            } catch (Exception e) {
                actionPlanJson = "[]";
            }
        }

        SurveyResult existing = surveyResultRepository.findByUser_Id(user.getId()).orElse(null);
        LocalDateTime now = LocalDateTime.now();
        SurveyResult toSave = (existing != null) ? existing : new SurveyResult();
        toSave.setUser(user);
        toSave.setCategory(category);
        toSave.setRecommendedTherapy(therapy);
        toSave.setCrisisFlag(crisis);
        toSave.setAiAnalysis(aiAnalysis);
        toSave.setActionPlan(actionPlanJson);
        toSave.setStressScore(stressScore);
        if (toSave.getCreatedAt() == null) toSave.setCreatedAt(now);
        toSave.setUpdatedAt(now);

        SurveyResult saved = surveyResultRepository.save(toSave);

        user.setSurveyCompletedAt(now);
        user.setSurveyCategory(category);
        user.setRecommendedTherapy(therapy);
        user.setCrisisFlag(crisis);
        userRepository.save(user);

        return saved;
    }

    private User findUser(String identifier) {
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private int n(Integer v) {
        if (v == null) return 0;
        if (v < 0) return 0;
        return Math.min(v, 3);
    }

    private TherapyType recommendTherapy(String category, boolean crisis) {
        if (crisis) return TherapyType.DBT; // structured coping + safety planning alongside urgent support

        if (category.contains("Anxiety")) return TherapyType.CBT;
        if (category.contains("Depression")) return TherapyType.ACT;
        if (category.contains("Trauma")) return TherapyType.TRAUMA_FOCUSED;
        if (category.contains("Sleep")) return TherapyType.SLEEP_CBT_I;
        if (category.contains("Attention")) return TherapyType.ADHD_COACHING;
        if (category.contains("Relationship")) return TherapyType.COUPLES_FAMILY;
        return TherapyType.GENERAL_COUNSELLING;
    }
}
