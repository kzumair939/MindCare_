package com.example.mindcare.service.impl;

import com.example.mindcare.dto.ReportFormDto;
import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.SessionReport;
import com.example.mindcare.entity.SessionReportRevision;
import com.example.mindcare.entity.Therapist;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.SessionReportRepository;
import com.example.mindcare.repository.SessionReportRevisionRepository;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.repository.TherapistRepository;
import com.example.mindcare.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final SessionRepository sessionRepository;
    private final TherapistRepository therapistRepository;
    private final SessionReportRepository sessionReportRepository;
    private final SessionReportRevisionRepository revisionRepository;

    @Override
    @Transactional(readOnly = true)
    public SessionReport getOrCreateForSession(Long sessionId, String therapistUsername) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        // Ensure lazy relations are initialized before leaving the service method.
        if (session.getUser() != null) {
            session.getUser().getId();
        }
        if (session.getTherapist() != null) {
            session.getTherapist().getId();
        }

        Therapist therapist = therapistRepository.findByUserAccount_Username(therapistUsername)
                .or(() -> therapistRepository.findByUserAccount_Email(therapistUsername))
                .orElseThrow(() -> new NotFoundException("Therapist account not found"));

        if (session.getTherapist() == null || !session.getTherapist().getId().equals(therapist.getId())) {
            throw new BadRequestException("You are not allowed to view this report");
        }

        return sessionReportRepository.findBySession_Id(sessionId)
                .orElseGet(() -> SessionReport.builder()
                        .session(session)
                        .user(session.getUser())
                        .therapist(therapist)
                        .createdAt(LocalDateTime.now())
                        .build());
    }

    @Override
    @Transactional
    public SessionReport saveForSession(Long sessionId, String therapistUsername, ReportFormDto form) {
        SessionReport report = getOrCreateForSession(sessionId, therapistUsername);

        if (report.getCreatedAt() == null) {
            report.setCreatedAt(LocalDateTime.now());
        }

        if (report.getId() != null) {
            revisionRepository.save(SessionReportRevision.builder()
                    .report(report)
                    .session(report.getSession())
                    .user(report.getUser())
                    .therapist(report.getTherapist())
                    .symptomsSummary(report.getSymptomsSummary())
                    .sessionGoals(report.getSessionGoals())
                    .progressRating(report.getProgressRating())
                    .nextSteps(report.getNextSteps())
                    .clientSummary(report.getClientSummary())
                    .privateNotes(report.getPrivateNotes())
                    .homeworkExercises(report.getHomeworkExercises())
                    .sharedWithClient(report.isSharedWithClient())
                    .savedAt(LocalDateTime.now())
                    .build());
        }

        report.setSymptomsSummary(trim(form.getSymptomsSummary()));
        report.setSessionGoals(trim(form.getSessionGoals()));
        report.setProgressRating(form.getProgressRating());
        report.setNextSteps(trim(form.getNextSteps()));
        report.setClientSummary(trim(form.getClientSummary()));
        report.setPrivateNotes(trim(form.getPrivateNotes()));
        report.setHomeworkExercises(trim(form.getHomeworkExercises()));
        report.setSharedWithClient(form.isSharedWithClient());
        report.setUpdatedAt(LocalDateTime.now());

        return sessionReportRepository.save(report);
    }

    @Override
    public List<SessionReport> getHistoryForUser(Long userId) {
        return sessionReportRepository.findAllByUser_IdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<SessionReportRevision> getRevisionsForSession(Long sessionId, String therapistUsername) {
        SessionReport report = getOrCreateForSession(sessionId, therapistUsername);
        if (report.getId() == null) return List.of();
        return revisionRepository.findAllByReport_IdOrderBySavedAtDesc(report.getId());
    }

    private String trim(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    @Override
    @Transactional(readOnly = true)
    public SessionReport getReportForUser(Long sessionId, String username) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (session.getUser() == null || (!session.getUser().getUsername().equals(username) && !session.getUser().getEmail().equals(username))) {
            throw new BadRequestException("You are not allowed to view this report");
        }

        SessionReport report = sessionReportRepository.findBySession_Id(sessionId).orElse(null);
        if (report == null || !report.isSharedWithClient()) {
            return null;
        }
        return report;
    }
}
