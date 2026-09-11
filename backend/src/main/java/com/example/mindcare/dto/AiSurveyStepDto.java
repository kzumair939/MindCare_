package com.example.mindcare.dto;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSurveyStepDto {
    private int questionNumber;
    private int totalEstimated;
    private String question;
    private String contextSnippet;
    private List<String> options;

    @JsonProperty("allowsFreeText")
    private boolean allowsFreeText;

    @JsonProperty("isCompleted")
    private boolean isCompleted;

    private AiTherapyRecommendationDto finalRecommendation;

    @JsonGetter("isCompleted")
    public boolean isCompleted() {
        return isCompleted;
    }

    @JsonSetter("isCompleted")
    public void setCompleted(boolean completed) {
        this.isCompleted = completed;
    }
}

