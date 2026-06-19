package com.example.mindcare.service;

import com.example.mindcare.Enum.TherapyType;
import com.example.mindcare.dto.SessionResponseDTO;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface SessionService {

    SessionResponseDTO bookSession(String username, Long therapistId, LocalDate date, LocalTime time,
                                   String mode, TherapyType therapyType, Integer feeAmount, boolean priority);


    List<SessionResponseDTO> getUserSessions(Long userId);

    public List<SessionResponseDTO> getUserSessionsByIdentifier(String identifier);

    // New: status flow
    void cancelSession(Long sessionId, String username);

    void completeSession(Long sessionId);

    void cancelSessionByAdmin(Long sessionId);

    // Therapist
    List<SessionResponseDTO> getTherapistSessionsByUsername(String therapistUsername);

    void confirmSessionByTherapist(Long sessionId, String therapistUsername);

    void completeSessionByTherapist(Long sessionId, String therapistUsername);

    void cancelSessionByTherapist(Long sessionId, String therapistUsername);

    // Admin
    List<SessionResponseDTO> getAllSessions();

    long countCompletedSessions(String username);
}
