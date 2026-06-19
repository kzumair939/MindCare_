package com.example.mindcare.service;

import com.example.mindcare.dto.ReportFormDto;
import com.example.mindcare.entity.SessionReport;
import com.example.mindcare.entity.SessionReportRevision;

import java.util.List;

public interface ReportService {
    SessionReport getOrCreateForSession(Long sessionId, String therapistUsername);
    SessionReport saveForSession(Long sessionId, String therapistUsername, ReportFormDto form);
    List<SessionReport> getHistoryForUser(Long userId);

    List<SessionReportRevision> getRevisionsForSession(Long sessionId, String therapistUsername);

    SessionReport getReportForUser(Long sessionId, String username);
}
