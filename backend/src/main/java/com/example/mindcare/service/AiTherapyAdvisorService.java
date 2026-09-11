package com.example.mindcare.service;

import com.example.mindcare.dto.AiSurveyAnswerItemDto;
import com.example.mindcare.dto.AiSurveyStepDto;
import com.example.mindcare.dto.AiTherapyRecommendationDto;
import com.example.mindcare.dto.SurveyFormDto;

import java.util.List;

public interface AiTherapyAdvisorService {
    AiSurveyStepDto startInteractiveAssessment();
    AiSurveyStepDto processNextStep(List<AiSurveyAnswerItemDto> history);
    AiTherapyRecommendationDto analyzeSurveyAndRecommend(SurveyFormDto form);
}
