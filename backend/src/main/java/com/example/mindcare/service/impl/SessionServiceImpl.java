package com.example.mindcare.service.impl;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.Enum.TherapyType;
import com.example.mindcare.dto.SessionResponseDTO;
import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.Therapist;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.mapper.SessionMapper;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.repository.TherapistRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.SessionService;
import lombok.AllArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final TherapistRepository therapistRepository;
    private final UserRepository userRepository;

    @Override
    public SessionResponseDTO bookSession(String identifier,
                                          Long therapistId,
                                          LocalDate date,
                                          LocalTime time,
                                          String mode,
                                          TherapyType therapyType,
                                          Integer feeAmount,
                                          boolean priority) {

        if (therapistId == null) {
            throw new BadRequestException("Please select a therapist");
        }
        if (date == null || time == null) {
            throw new BadRequestException("Please select date and time");
        }

        System.out.println("DEBUG: Looking for user with identifier: " + identifier);
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new NotFoundException("User not found: " + identifier));

        Therapist therapist = therapistRepository.findById(therapistId)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));

        if (!therapist.isActive()) {
            throw new BadRequestException("Therapist is not active");
        }

        boolean exists = sessionRepository
                .existsByTherapistAndSessionDateAndSessionTimeAndStatus(therapist, date, time, AppointmentStatus.BOOKED);

        if (exists) {
            throw new BadRequestException("This therapist is already booked for this time");
        }

        Session session = Session.builder()
                .user(user)
                .therapist(therapist)
                .sessionDate(date)
                .sessionTime(time)
                .sessionType(mode)
                .therapyType(therapyType)
                .feeAmount(feeAmount)
                .priority(priority)
                .durationMinutes(60)
                .status(AppointmentStatus.BOOKED)
                .build();

        Session savedSession;
        try {
            savedSession = sessionRepository.save(session);
        } catch (DataIntegrityViolationException ex) {
            // Extra protection in case of race conditions or an older DB schema.
            throw new BadRequestException("This therapist is already booked for this time");
        }
        return SessionMapper.toDTO(savedSession);
    }

    @Override
    public List<SessionResponseDTO> getUserSessions(Long userId) {
        return sessionRepository.findByUserId(userId)
                .stream()
                .map(SessionMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<SessionResponseDTO> getUserSessionsByIdentifier(String identifier) {
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new NotFoundException("User Not Found: " + identifier));

        return sessionRepository.findAllByUser_Email(user.getEmail())
                .stream()
                .map(SessionMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void cancelSession(Long sessionId, String username) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        // Verify the user owns this session (by email or username)
        User sessionUser = session.getUser();
        boolean isOwner = sessionUser != null &&
            (sessionUser.getEmail().equals(username) || sessionUser.getUsername().equals(username));
        if (!isOwner) {
            throw new BadRequestException("You are not allowed to cancel this session");
        }

        AppointmentStatus cur = session.getStatus();
        if (cur != AppointmentStatus.BOOKED && cur != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Only BOOKED or CONFIRMED sessions can be cancelled");
        }

        session.setStatus(AppointmentStatus.CANCELLED);
        session.setCancelledAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Override
    public void completeSession(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        AppointmentStatus cur = session.getStatus();
        if (cur != AppointmentStatus.BOOKED && cur != AppointmentStatus.CONFIRMED) {
            throw new BadRequestException("Only BOOKED or CONFIRMED sessions can be completed");
        }

        session.setStatus(AppointmentStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Override
    public void cancelSessionByAdmin(Long sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (session.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Completed sessions cannot be cancelled");
        }

        session.setStatus(AppointmentStatus.CANCELLED);
        session.setCancelledAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    @Override
    public List<SessionResponseDTO> getAllSessions() {
        return sessionRepository.findAll()
                .stream()
                .map(SessionMapper::toDTO)
                .collect(Collectors.toList());
    }

    // =========================
    // Therapist
    // =========================

    @Override
    public List<SessionResponseDTO> getTherapistSessionsByUsername(String therapistUsername) {

        if (therapistUsername == null || therapistUsername.isBlank()) {
            throw new BadRequestException("Invalid therapist user");
        }

        // Try email first, then username
        List<Session> sessions = sessionRepository.findAllByTherapist_UserAccount_Email(therapistUsername);
        if (sessions.isEmpty()) {
            sessions = sessionRepository.findAllByTherapist_UserAccount_Username(therapistUsername);
        }
        return sessions.stream()
                .map(SessionMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void confirmSessionByTherapist(Long sessionId, String therapistUsername) {
        updateStatusForTherapist(sessionId, therapistUsername, AppointmentStatus.CONFIRMED);
    }

    @Override
    public void completeSessionByTherapist(Long sessionId, String therapistUsername) {
        updateStatusForTherapist(sessionId, therapistUsername, AppointmentStatus.COMPLETED);
    }

    @Override
    public void cancelSessionByTherapist(Long sessionId, String therapistUsername) {
        updateStatusForTherapist(sessionId, therapistUsername, AppointmentStatus.CANCELLED);
    }

    private void updateStatusForTherapist(Long sessionId, String therapistUsername, AppointmentStatus newStatus) {

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        // Resolve logged-in therapist account -> therapist profile
        Therapist loggedInTherapist =
                therapistRepository.findByUserAccount_Username(therapistUsername)
                .or(() -> therapistRepository.findByUserAccount_Email(therapistUsername))
                .orElseThrow(() -> new BadRequestException("This account is not linked to any therapist"));

        if (session.getTherapist() == null || session.getTherapist().getId() == null) {
            throw new BadRequestException("Session has no therapist assigned");
        }

        if (!session.getTherapist().getId().equals(loggedInTherapist.getId())) {
            throw new BadRequestException("You are not allowed to manage this session");
        }

        AppointmentStatus current = session.getStatus();

        // Validate state transitions
        if (newStatus == AppointmentStatus.CONFIRMED && current != AppointmentStatus.BOOKED) {
            throw new BadRequestException("Only BOOKED sessions can be confirmed");
        }
        if (newStatus == AppointmentStatus.COMPLETED && current != AppointmentStatus.CONFIRMED && current != AppointmentStatus.BOOKED) {
            throw new BadRequestException("Only CONFIRMED or BOOKED sessions can be completed");
        }
        if (newStatus == AppointmentStatus.CANCELLED && (current == AppointmentStatus.COMPLETED || current == AppointmentStatus.CANCELLED)) {
            throw new BadRequestException("Cannot cancel a completed or already-cancelled session");
        }

        session.setStatus(newStatus);
        if (newStatus == AppointmentStatus.COMPLETED) {
            session.setCompletedAt(LocalDateTime.now());
        }
        if (newStatus == AppointmentStatus.CANCELLED) {
            session.setCancelledAt(LocalDateTime.now());
        }
        sessionRepository.save(session);
    }

    @Override
    public long countCompletedSessions(String email) {
        return sessionRepository.countByUser_EmailAndStatus(email, AppointmentStatus.COMPLETED);
    }

}
