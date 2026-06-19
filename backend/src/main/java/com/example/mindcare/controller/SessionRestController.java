package com.example.mindcare.controller;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.Enum.TherapyType;
import com.example.mindcare.dto.SessionResponseDTO;
import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.Therapist;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.repository.TherapistRepository;
import com.example.mindcare.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Locale;
import com.example.mindcare.repository.SessionMessageRepository;
import com.example.mindcare.service.UserService;
import com.example.mindcare.entity.User;
import com.example.mindcare.entity.SessionMessage;
import java.util.stream.Collectors;
import java.util.*;

@RestController
@RequestMapping("/api/session")
@RequiredArgsConstructor
public class SessionRestController {
    private final SessionService sessionService;
    private final SessionRepository sessionRepository;
    private final SessionMessageRepository sessionMessageRepository;
    private final UserService userService;
    private final TherapistRepository therapistRepository;

    private static LocalTime parseTimeSafely(String timeStr, LocalTime defaultTime) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return defaultTime;
        }
        String clean = timeStr.trim();
        try {
            return LocalTime.parse(clean);
        } catch (Exception ignored) {}

        String[] formats = {
            "HH:mm", "H:mm", "HH:mm:ss", "H:mm:ss",
            "hh:mm a", "h:mm a", "hh:mm:ss a", "h:mm:ss a",
            "hh:mma", "h:mma", "hh:mm:ssa", "h:mm:ssa"
        };
        for (String format : formats) {
            try {
                DateTimeFormatter formatter = new DateTimeFormatterBuilder()
                        .parseCaseInsensitive()
                        .appendPattern(format)
                        .toFormatter(Locale.ENGLISH);
                return LocalTime.parse(clean, formatter);
            } catch (Exception ignored) {}
        }
        return defaultTime;
    }

    private static LocalDate parseDateSafely(String dateStr, LocalDate defaultDate) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return defaultDate;
        }
        String clean = dateStr.trim();
        try {
            return LocalDate.parse(clean);
        } catch (Exception ignored) {}

        String[] formats = {
            "yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "yyyy/MM/dd", "yyyy-M-d", "M/d/yyyy", "d/M/yyyy"
        };
        for (String format : formats) {
            try {
                return LocalDate.parse(clean, DateTimeFormatter.ofPattern(format));
            } catch (Exception ignored) {}
        }
        return defaultDate;
    }

    /**
     * GET /api/session/slots?therapistId=&date=YYYY-MM-DD
     * Returns all 1-hour time slots for the therapist's working hours on that date,
     * with each slot marked available=true/false based on existing BOOKED/CONFIRMED sessions.
     */
    @GetMapping("/slots")
    public ResponseEntity<?> getSlots(
            @RequestParam Long therapistId,
            @RequestParam String date) {
        try {
            Therapist therapist = therapistRepository.findById(therapistId).orElse(null);
            if (therapist == null) return ResponseEntity.badRequest().body(Map.of("error", "Therapist not found"));

            String startStr = therapist.getAvailableTimeStart();
            String endStr   = therapist.getAvailableTimeEnd();

            LocalTime start = parseTimeSafely(startStr, LocalTime.of(9, 0));
            LocalTime end   = parseTimeSafely(endStr, LocalTime.of(17, 0));

            if (end.equals(LocalTime.MIDNIGHT)) {
                end = LocalTime.MAX;
            }
            if (end.isBefore(start) && end.getHour() < 12) {
                end = end.plusHours(12);
            }

            if (start.isAfter(end) || start.equals(end)) {
                return ResponseEntity.ok(Map.of(
                    "therapistId", therapistId,
                    "date", date,
                    "slots", new ArrayList<>()
                ));
            }

            LocalDate localDate = parseDateSafely(date, LocalDate.now());

            // Get all booked/confirmed sessions for this therapist on this date
            List<AppointmentStatus> activeStatuses = List.of(AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED);
            List<Session> existingSessions = sessionRepository
                    .findAllByTherapist_IdAndSessionDateAndStatusIn(therapistId, localDate, activeStatuses);
            Set<String> bookedTimes = existingSessions.stream()
                    .map(Session::getSessionTime)
                    .filter(Objects::nonNull)
                    .map(sTime -> sTime.format(DateTimeFormatter.ofPattern("HH:mm")))
                    .collect(Collectors.toSet());

            // Generate 1-hour slots
            List<Map<String, Object>> slots = new ArrayList<>();
            LocalTime cursor = start;
            LocalTime previous = null;
            int safetyCounter = 0;
            while (!cursor.isAfter(end.minusMinutes(30)) && safetyCounter < 24) {
                if (previous != null && !cursor.isAfter(previous)) {
                    break;
                }
                safetyCounter++;
                String slotTime = cursor.format(DateTimeFormatter.ofPattern("HH:mm"));
                Map<String, Object> slot = new LinkedHashMap<>();
                slot.put("time", slotTime);
                slot.put("available", !bookedTimes.contains(slotTime));
                slots.add(slot);
                
                previous = cursor;
                cursor = cursor.plusMinutes(60);
            }

            return ResponseEntity.ok(Map.of(
                "therapistId", therapistId,
                "date", date,
                "slots", slots
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> mySessions(Authentication auth) {
        return ResponseEntity.ok(sessionService.getUserSessionsByIdentifier(auth.getName()));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long id, Authentication auth) {
        User me = userService.findByIdentifier(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(401).build();

        List<SessionMessage> msgs = sessionMessageRepository.findAllBySessionIdOrderBySentAtAsc(id);
        List<Map<String, Object>> result = msgs.stream().map(m -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("sender", m.getSenderName());
            map.put("content", m.getContent());
            map.put("ts", m.getSentAt() != null ? m.getSentAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
            boolean mine = m.getSenderName().equals("You") ||
                           m.getSenderName().equals(me.getUsername()) ||
                           m.getSenderName().equals(me.getDisplayName());
            map.put("mine", mine);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookSession(@RequestBody Map<String,Object> req, Authentication auth) {
        try {
            Long therapistId = Long.parseLong(req.get("therapistId").toString());
            LocalDate date   = parseDateSafely(req.get("date").toString(), null);
            LocalTime time   = parseTimeSafely(req.get("time").toString(), null);
            String mode      = req.get("sessionType").toString();
            TherapyType type = TherapyType.valueOf(req.get("therapyType").toString());
            SessionResponseDTO dto = sessionService.bookSession(auth.getName(), therapistId, date, time, mode, type, null, false);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication auth) {
        sessionService.cancelSession(id, auth.getName());
        return ResponseEntity.ok(Map.of("message","Cancelled"));
    }

    @GetMapping("/{id}/online-info")
    public ResponseEntity<?> onlineInfo(@PathVariable Long id, Authentication auth) {
        Session s = sessionRepository.findById(id).orElseThrow();
        boolean isTherapist = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_THERAPIST"));
        Map<String,Object> info = new LinkedHashMap<>();
        info.put("sessionId", s.getId());
        info.put("isTherapist", isTherapist);
        info.put("therapistName", s.getTherapist() != null ? s.getTherapist().getName() : "Therapist");
        info.put("clientName", s.getUser() != null ?
            (s.getUser().getDisplayName() != null ? s.getUser().getDisplayName() : s.getUser().getUsername()) : "Patient");
        return ResponseEntity.ok(info);
    }

    // Therapist endpoints
    @GetMapping("/therapist")
    public ResponseEntity<?> therapistSessions(Authentication auth) {
        return ResponseEntity.ok(sessionService.getTherapistSessionsByUsername(auth.getName()));
    }

    // Therapist confirm session (BOOKED -> CONFIRMED)
    @PutMapping("/therapist/sessions/{id}/status")
    public ResponseEntity<?> updateSessionStatus(@PathVariable Long id, @RequestBody Map<String,Object> body, Authentication auth) {
        String status = body.get("status") != null ? body.get("status").toString() : "";
        try {
            if ("CONFIRMED".equals(status)) {
                sessionService.confirmSessionByTherapist(id, auth.getName());
            } else if ("COMPLETED".equals(status)) {
                sessionService.completeSessionByTherapist(id, auth.getName());
            } else if ("CANCELLED".equals(status)) {
                sessionService.cancelSessionByTherapist(id, auth.getName());
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + status));
            }
            return ResponseEntity.ok(Map.of("message", "Session status updated to " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/end")
    public ResponseEntity<?> endSession(@PathVariable Long id, Authentication auth) {
        try {
            sessionService.completeSessionByTherapist(id, auth.getName());
        } catch (Exception e) {
            // If not therapist, try user cancel
            try {
                sessionService.cancelSession(id, auth.getName());
            } catch (Exception e2) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not end session: " + e.getMessage()));
            }
        }
        return ResponseEntity.ok(Map.of("message", "Session ended"));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id, Authentication auth) {
        sessionService.completeSessionByTherapist(id, auth.getName());
        return ResponseEntity.ok(Map.of("message","Completed"));
    }

    @PostMapping("/{id}/therapist-cancel")
    public ResponseEntity<?> therapistCancel(@PathVariable Long id, Authentication auth) {
        sessionService.cancelSessionByTherapist(id, auth.getName());
        return ResponseEntity.ok(Map.of("message","Cancelled"));
    }

    // GET single session (for OnlineSession page)
    @GetMapping("/{id}")
    public ResponseEntity<?> getSession(@PathVariable Long id, Authentication auth) {
        Session s = sessionRepository.findById(id).orElse(null);
        if (s == null) return ResponseEntity.notFound().build();
        boolean isTherapist = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_THERAPIST"));
        Map<String,Object> info = new LinkedHashMap<>();
        info.put("id", s.getId());
        info.put("status", s.getStatus().name());
        info.put("sessionDate", s.getSessionDate() != null ? s.getSessionDate().toString() : null);
        info.put("sessionTime", s.getSessionTime() != null ? s.getSessionTime().toString() : null);
        info.put("sessionType", s.getSessionType());
        info.put("therapyType", s.getTherapyType() != null ? s.getTherapyType().name() : null);
        info.put("therapistName", s.getTherapist() != null ? s.getTherapist().getName() : "Therapist");
        info.put("userName", s.getUser() != null
            ? (s.getUser().getDisplayName() != null ? s.getUser().getDisplayName() : s.getUser().getUsername())
            : "Patient");
        return ResponseEntity.ok(info);
    }

    // Admin
    @GetMapping("/admin/all")
    public ResponseEntity<?> allSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/debug-therapists")
    public ResponseEntity<?> debugTherapists() {
        return ResponseEntity.ok(therapistRepository.findAll().stream().map(t -> {
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("name", t.getName());
            m.put("availableTimeStart", t.getAvailableTimeStart());
            m.put("availableTimeEnd", t.getAvailableTimeEnd());
            m.put("availableDays", t.getAvailableDays());
            return m;
        }).collect(Collectors.toList()));
    }
}
