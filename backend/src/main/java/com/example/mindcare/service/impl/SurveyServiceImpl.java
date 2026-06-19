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
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SurveyServiceImpl implements SurveyService {

    private final SurveyResultRepository surveyResultRepository;
    private final UserRepository userRepository;

    @Override
    public SurveyResult getForUser(String identifier) {
        User user = findUser(identifier);
        return surveyResultRepository.findByUser_Id(user.getId()).orElse(null);
    }

    @Override
    public SurveyResult saveForUser(String identifier, SurveyFormDto form) {
        User user = findUser(identifier);

        // Normalize nulls to 0
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

        // Crisis detection (Q9)
        boolean crisis = q9 >= 2;

        // Simple screening scoring (not diagnostic)
        int anxiety = q1 + q2 + q6;
        int depression = q3 + q4 + q10;
        int trauma = q7 + q8;
        int sleep = q5;
        int adhdLike = q6;
        int relationship = q10;

        Map<String, Integer> scores = new LinkedHashMap<>();
        scores.put("Anxiety / Worry", anxiety);
        scores.put("Low Mood / Depression", depression);
        scores.put("Trauma / High stress reactions", trauma);
        scores.put("Sleep difficulty", sleep);
        scores.put("Attention / Overwhelm", adhdLike);
        scores.put("Relationship / Social stress", relationship);

        String topCategory = scores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("General wellbeing");

        TherapyType therapy = recommendTherapy(topCategory, crisis);

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
        toSave.setCategory(topCategory);
        toSave.setRecommendedTherapy(therapy);
        toSave.setCrisisFlag(crisis);
        if (toSave.getCreatedAt() == null) toSave.setCreatedAt(now);
        toSave.setUpdatedAt(now);

        SurveyResult saved = surveyResultRepository.save(toSave);

        // Store summary on User for easy dashboard access
        user.setSurveyCompletedAt(now);
        user.setSurveyCategory(topCategory);
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
