package com.example.mindcare.service;

import com.example.mindcare.Enum.TherapyType;
import com.example.mindcare.dto.AiTherapyRecommendationDto;
import com.example.mindcare.dto.SurveyFormDto;
import com.example.mindcare.service.impl.AiTherapyAdvisorServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AiTherapyAdvisorServiceTest {

    private AiTherapyAdvisorServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AiTherapyAdvisorServiceImpl(new ObjectMapper());
    }

    @Test
    void testFallbackHighAnxietyRecommendsCBT() {
        SurveyFormDto form = new SurveyFormDto();
        form.setQ1(5); // high anxiety
        form.setQ2(2);
        form.setQ3(2);
        form.setQ4(2);
        form.setQ5(5); // high overwhelm
        form.setQ6(3);
        form.setQ7(2);
        form.setQ8(5); // high stress
        form.setQ9(1); // safe
        form.setQ10(2);

        AiTherapyRecommendationDto result = service.analyzeSurveyAndRecommend(form);

        assertNotNull(result);
        assertEquals(TherapyType.CBT, result.getRecommendedTherapy());
        assertFalse(result.isCrisisFlag());
        assertNotNull(result.getAiAnalysis());
        assertFalse(result.getActionPlan().isEmpty());
    }

    @Test
    void testCrisisDetectionRecommendsDBT() {
        SurveyFormDto form = new SurveyFormDto();
        form.setQ1(4);
        form.setQ2(4);
        form.setQ3(4);
        form.setQ4(4);
        form.setQ5(4);
        form.setQ6(1);
        form.setQ7(4);
        form.setQ8(4);
        form.setQ9(3); // crisis indicator
        form.setQ10(5);

        AiTherapyRecommendationDto result = service.analyzeSurveyAndRecommend(form);

        assertNotNull(result);
        assertEquals(TherapyType.DBT, result.getRecommendedTherapy());
        assertTrue(result.isCrisisFlag());
    }
}
