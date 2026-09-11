package com.example.mindcare.scheduler;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.User;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.service.AsyncEmailDispatcher;
import com.example.mindcare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionReminderScheduler {

    private final SessionRepository sessionRepository;
    private final NotificationService notificationService;
    private final AsyncEmailDispatcher emailDispatcher;

    // Track notified sessions with timestamp to allow safe eviction
    private final Map<Long, LocalDateTime> notifiedSessions = new ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 60_000) // runs every minute
    public void sendSessionReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.plusMinutes(9);
        LocalDateTime windowEnd = now.plusMinutes(11);

        // Periodically purge entries older than 24 hours to prevent memory leaks
        notifiedSessions.entrySet().removeIf(entry -> entry.getValue().isBefore(now.minusHours(24)));

        var sessions = sessionRepository.findAllByStatusIn(List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED));
        if (sessions == null) return;

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy 'at' HH:mm");

        for (Session s : sessions) {
            if (s.getSessionDate() == null || s.getSessionTime() == null) continue;
            if (notifiedSessions.containsKey(s.getId())) continue;

            LocalDateTime sessionStart = LocalDateTime.of(s.getSessionDate(), s.getSessionTime());
            if (sessionStart.isAfter(windowStart) && sessionStart.isBefore(windowEnd)) {
                String timeStr = sessionStart.format(fmt);
                String msg = "Reminder: Your session starts in ~10 minutes (" + timeStr + ")";

                // Notify user
                User patient = s.getUser();
                if (patient != null) {
                    notificationService.create(patient, msg, "SESSION_REMINDER", s.getId());
                    emailDispatcher.sendSimpleEmailAsync(patient.getEmail(), "MindCare Session Reminder", msg);
                }

                // Notify therapist via their linked user account
                if (s.getTherapist() != null && s.getTherapist().getUserAccount() != null) {
                    User therapistUser = s.getTherapist().getUserAccount();
                    notificationService.create(therapistUser, msg, "SESSION_REMINDER", s.getId());
                    emailDispatcher.sendSimpleEmailAsync(s.getTherapist().getEmail(), "MindCare Session Reminder", msg);
                }

                notifiedSessions.put(s.getId(), now);
                log.info("Sent 10-min reminder for session id={}", s.getId());
            }
        }
    }
}
