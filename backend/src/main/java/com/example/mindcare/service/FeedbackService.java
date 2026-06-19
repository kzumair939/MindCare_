package com.example.mindcare.service;

import com.example.mindcare.dto.FeedbackFormDto;
import com.example.mindcare.entity.Feedback;

public interface FeedbackService {
    Feedback getForSession(Long sessionId);
    boolean canGiveFeedback(String username, Long sessionId);
    Feedback submit(String username, Long sessionId, FeedbackFormDto form);
    void skip(String username, Long sessionId);
}
