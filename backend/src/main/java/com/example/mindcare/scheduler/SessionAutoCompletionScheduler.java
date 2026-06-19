package com.example.mindcare.scheduler;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.entity.Session;
import com.example.mindcare.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Automatically marks sessions as COMPLETED when their duration has elapsed.
 *
 * Runs every minute.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionAutoCompletionScheduler {

    private final SessionRepository sessionRepository;

    @Scheduled(fixedDelay = 60_000)
    public void autoCompleteExpiredSessions() {

        var bookedSessions = sessionRepository.findAllByStatus(AppointmentStatus.BOOKED);
        if (bookedSessions == null || bookedSessions.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();

        for (Session s : bookedSessions) {
            if (s.getSessionDate() == null || s.getSessionTime() == null) continue;

            int durationMinutes = (s.getDurationMinutes() != null && s.getDurationMinutes() > 0)
                    ? s.getDurationMinutes()
                    : 60;

            LocalDateTime start = LocalDateTime.of(s.getSessionDate(), s.getSessionTime());
            LocalDateTime end = start.plusMinutes(durationMinutes);

            if (!end.isAfter(now)) {
                s.setStatus(AppointmentStatus.COMPLETED);
                if (s.getCompletedAt() == null) {
                    s.setCompletedAt(now);
                }
                sessionRepository.save(s);
                log.info("Auto-completed session id={} (ended {} minutes ago)", s.getId(),
                        Duration.between(end, now).toMinutes());
            }
        }
    }
}
