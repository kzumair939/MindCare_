package com.example.mindcare.dto;

import com.example.mindcare.Enum.TherapyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTherapyRecommendationDto {
    private String category;
    private TherapyType recommendedTherapy;
    private String aiAnalysis;
    private List<String> actionPlan;
    private Integer stressScore;
    private boolean crisisFlag;
}
