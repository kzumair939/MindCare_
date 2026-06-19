package com.example.mindcare.service;

import com.example.mindcare.dto.SurveyFormDto;
import com.example.mindcare.entity.SurveyResult;

public interface SurveyService {
    SurveyResult getForUser(String username);
    SurveyResult saveForUser(String username, SurveyFormDto form);
}
