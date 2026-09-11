package com.example.mindcare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSurveyAnswerItemDto {
    private int questionNumber;
    private String question;
    private String answer;
}
