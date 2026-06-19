package com.example.mindcare.dto;
import lombok.Data;
@Data
public class FeedbackFormDto {
    private int rating;
    private Integer nps;
    private String comments;
}
