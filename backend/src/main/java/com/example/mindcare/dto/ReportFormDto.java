package com.example.mindcare.dto;
import lombok.Data;
@Data
public class ReportFormDto {
    private String symptomsSummary;
    private String sessionGoals;
    private Integer progressRating;
    private String nextSteps;
    private String clientSummary;
    private String privateNotes;
    private String homeworkExercises;
    private boolean sharedWithClient;
}
