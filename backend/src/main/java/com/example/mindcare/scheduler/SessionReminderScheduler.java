package com.example.mindcare.scheduler;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.User;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionReminderScheduler {

    private final SessionRepository sessionRepository;
    private final NotificationService notificationService;
    private final JavaMailSender mailSender;

    // Track already-notified sessions to avoid duplicates
    private final Set<Long> notifiedSessions = new HashSet<>();

    @Scheduled(fixedDelay = 60_000) // runs every minute
    public void sendSessionReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.plusMinutes(9);
        LocalDateTime windowEnd = now.plusMinutes(11);

        var sessions = sessionRepository.findAllByStatus(AppointmentStatus.BOOKED);
        if (sessions == null) return;

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy 'at' HH:mm");

        for (Session s : sessions) {
            if (s.getSessionDate() == null || s.getSessionTime() == null) continue;
            if (notifiedSessions.contains(s.getId())) continue;

            LocalDateTime sessionStart = LocalDateTime.of(s.getSessionDate(), s.getSessionTime());
            if (sessionStart.isAfter(windowStart) && sessionStart.isBefore(windowEnd)) {
                String timeStr = sessionStart.format(fmt);
                String msg = "Reminder: Your session starts in ~10 minutes (" + timeStr + ")";

                // Notify user
                User patient = s.getUser();
                if (patient != null) {
                    notificationService.create(patient, msg, "SESSION_REMINDER", s.getId());
                    sendEmail(patient.getEmail(), "MindCare Session Reminder", msg);
                }

                // Notify therapist via their linked user account
                if (s.getTherapist() != null && s.getTherapist().getUserAccount() != null) {
                    User therapistUser = s.getTherapist().getUserAccount();
                    notificationService.create(therapistUser, msg, "SESSION_REMINDER", s.getId());
                    sendEmail(s.getTherapist().getEmail(), "MindCare Session Reminder", msg);
                }

                notifiedSessions.add(s.getId());
                log.info("Sent 10-min reminder for session id={}", s.getId());
            }
        }
    }

    private void sendEmail(String to, String subject, String body) {
        if (to == null || to.isBlank()) return;
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setTo(to);
            m.setSubject(subject);
            m.setText(body);
            mailSender.send(m);
        } catch (Exception e) {
            log.warn("Could not send reminder email to {}: {}", to, e.getMessage());
        }
    }
}
