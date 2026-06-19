package com.example.mindcare.service.impl;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.dto.FeedbackFormDto;
import com.example.mindcare.entity.Feedback;
import com.example.mindcare.entity.Session;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.FeedbackRepository;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final SessionRepository sessionRepository;

    @Override
    public Feedback getForSession(Long sessionId) {
        return feedbackRepository.findBySession_Id(sessionId).orElse(null);
    }

    @Override
    public boolean canGiveFeedback(String username, Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (session.getUser() == null) {
            return false;
        }

        String dbUsername = session.getUser().getUsername();
        String dbEmail = session.getUser().getEmail();

        boolean matches =
                (dbUsername != null && dbUsername.equals(username))
                        || (dbEmail != null && dbEmail.equals(username));

        if (!matches) {
            return false;
        }

        if (session.getStatus() != AppointmentStatus.COMPLETED) return false;

        LocalDateTime completedAt = session.getCompletedAt();
        if (completedAt == null) {
            // fallback
            completedAt = LocalDateTime.of(session.getSessionDate(), session.getSessionTime()).plusMinutes(
                    session.getDurationMinutes() != null ? session.getDurationMinutes() : 60
            );
        }
        return completedAt.isAfter(LocalDateTime.now().minusDays(7));
    }

    @Override
    public Feedback submit(String username, Long sessionId, FeedbackFormDto form) {
        if (!canGiveFeedback(username, sessionId)) {
            throw new BadRequestException("Feedback is not available for this session");
        }

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        int rating = clamp(form.getRating(), 1, 5);
        int nps = clamp(form.getNps(), 0, 10);

        Feedback fb = feedbackRepository.findBySession_Id(sessionId).orElse(null);
        if (fb == null) {
            fb = Feedback.builder()
                    .session(session)
                    .user(session.getUser())
                    .therapist(session.getTherapist())
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        fb.setRating(rating);
        fb.setNps(nps);
        fb.setComments(trim(form.getComments()));
        // if user submits, we clear skippedAt
        fb.setSkippedAt(null);

        return feedbackRepository.save(fb);
    }

    @Override
    public void skip(String username, Long sessionId) {
        if (!canGiveFeedback(username, sessionId)) {
            throw new BadRequestException("Feedback is not available for this session");
        }

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        Feedback fb = feedbackRepository.findBySession_Id(sessionId).orElse(null);
        if (fb == null) {
            fb = Feedback.builder()
                    .session(session)
                    .user(session.getUser())
                    .therapist(session.getTherapist())
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        if (fb.getSkippedAt() == null) {
            fb.setSkippedAt(LocalDateTime.now());
            feedbackRepository.save(fb);
        }
    }

    private int clamp(Integer v, int min, int max) {
        if (v == null) return min;
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }

    private String trim(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
