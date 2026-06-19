package com.example.mindcare.controller;

import com.example.mindcare.entity.GroupMessage;
import com.example.mindcare.entity.Therapist;
import com.example.mindcare.entity.User;
import com.example.mindcare.repository.FeedbackRepository;
import com.example.mindcare.repository.GroupMessageRepository;
import com.example.mindcare.repository.TherapistRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.SessionService;
import com.example.mindcare.service.TherapistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminRestController {
    private final TherapistService therapistService;
    private final SessionService sessionService;
    private final TherapistRepository therapistRepository;
    private final FeedbackRepository feedbackRepository;
    private final GroupMessageRepository groupMessageRepository;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        List<Therapist> all = therapistService.getAllTherapists();
        return ResponseEntity.ok(Map.of(
            "therapistCount", all.size(),
            "activeTherapistCount", all.stream().filter(Therapist::isActive).count(),
            "verifiedTherapistCount", all.stream().filter(Therapist::isVerified).count(),
            "sessionCount", sessionService.getAllSessions().size()
        ));
    }

    @GetMapping("/therapists")
    public ResponseEntity<?> therapists() {
        return ResponseEntity.ok(therapistService.getAllTherapists().stream().map(t -> {
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id",t.getId()); m.put("name",t.getName()); m.put("email",t.getEmail());
            m.put("specialization",t.getSpecialization()); m.put("sessionPrice",t.getSessionPrice());
            m.put("active",t.isActive()); m.put("verified",t.isVerified());
            m.put("profilePicturePath",t.getProfilePicturePath());
            return m;
        }).collect(Collectors.toList()));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> sessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/users")
    public ResponseEntity<?> users() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(u -> {
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("displayName", u.getDisplayName());
            m.put("role", u.getRole());
            m.put("anonymousMode", u.isAnonymousMode());
            m.put("blocked", u.isBlocked());
            return m;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/therapists/{id}/account")
    public ResponseEntity<?> createAccount(@PathVariable Long id, @RequestBody Map<String,String> req) {
        therapistService.createTherapistAccount(id, req.get("username"), req.get("password"));
        return ResponseEntity.ok(Map.of("message","Account created"));
    }

    // ──────────────────────────────────────────
    // ANALYTICS
    // ──────────────────────────────────────────
    @GetMapping("/analytics")
    public ResponseEntity<?> analytics() {
        Map<String,Object> data = new LinkedHashMap<>();

        // Session stats
        var sessions = sessionService.getAllSessions();
        long completed = sessions.stream().filter(s -> "COMPLETED".equals(s.getStatus())).count();
        long cancelled = sessions.stream().filter(s -> "CANCELLED".equals(s.getStatus())).count();
        long booked    = sessions.stream().filter(s -> "BOOKED".equals(s.getStatus())).count();
        long confirmed = sessions.stream().filter(s -> "CONFIRMED".equals(s.getStatus())).count();
        data.put("totalSessions", sessions.size());
        data.put("completedSessions", completed);
        data.put("cancelledSessions", cancelled);
        data.put("bookedSessions", booked);
        data.put("confirmedSessions", confirmed);

        // User stats
        data.put("totalUsers", userRepository.count());
        data.put("totalTherapists", therapistRepository.count());

        // Feedback stats
        Double avgRating = feedbackRepository.avgRating();
        Long feedbackCount = feedbackRepository.totalCount();
        data.put("averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0);
        data.put("totalFeedback", feedbackCount != null ? feedbackCount : 0);

        // Therapist ratings
        List<Object[]> ratings = feedbackRepository.avgRatingByTherapist();
        List<Map<String,Object>> therapistRatings = ratings.stream().map(row -> {
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("therapistId", row[0]);
            m.put("avgRating", row[1] != null ? Math.round(((Double)row[1]) * 10.0) / 10.0 : 0);
            // Look up therapist name
            therapistRepository.findById(((Number)row[0]).longValue()).ifPresent(t -> m.put("name", t.getName()));
            return m;
        }).collect(Collectors.toList());
        data.put("therapistRatings", therapistRatings);

        return ResponseEntity.ok(data);
    }

    // ──────────────────────────────────────────
    // FEEDBACK (All)
    // ──────────────────────────────────────────
    @GetMapping("/feedback")
    public ResponseEntity<?> allFeedback() {
        return ResponseEntity.ok(feedbackRepository.findAll().stream().map(f -> {
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id", f.getId());
            m.put("rating", f.getRating());
            m.put("nps", f.getNps());
            m.put("comments", f.getComments());
            m.put("createdAt", f.getCreatedAt());
            m.put("sessionId", f.getSession() != null ? f.getSession().getId() : null);
            m.put("userName", f.getUser() != null ?
                (f.getUser().getDisplayName() != null ? f.getUser().getDisplayName() : f.getUser().getUsername()) : "Anonymous");
            m.put("therapistName", f.getTherapist() != null ? f.getTherapist().getName() : "—");
            return m;
        }).collect(Collectors.toList()));
    }

    // ──────────────────────────────────────────
    // REPORTED MESSAGES
    // ──────────────────────────────────────────
    @GetMapping("/reports")
    public ResponseEntity<?> reports() {
        List<GroupMessage> reported = groupMessageRepository.findAll().stream()
            .filter(GroupMessage::isReported)
            .sorted(Comparator.comparing(GroupMessage::getSentAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .collect(Collectors.toList());

        return ResponseEntity.ok(reported.stream().map(m -> {
            Map<String,Object> map = new LinkedHashMap<>();
            map.put("id", m.getId());
            map.put("content", m.getContent());
            map.put("reportReason", m.getReportReason());
            map.put("anonymous", m.isAnonymous());
            map.put("sentAt", m.getSentAt());
            map.put("roomId", m.getRoom() != null ? m.getRoom().getId() : null);
            map.put("roomName", m.getRoom() != null ? m.getRoom().getName() : "—");
            if (m.getSender() != null) {
                map.put("senderId", m.getSender().getId());
                map.put("senderUsername", m.getSender().getUsername());
                map.put("senderName", m.isAnonymous() ? "Anonymous" :
                    (m.getSender().getDisplayName() != null ? m.getSender().getDisplayName() : m.getSender().getUsername()));
                map.put("senderBlocked", m.getSender().isBlocked());
            }
            return map;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/reports/{id}/dismiss")
    public ResponseEntity<?> dismissReport(@PathVariable Long id) {
        return groupMessageRepository.findById(id).map(m -> {
            m.setReported(false);
            groupMessageRepository.save(m);
            return ResponseEntity.ok(Map.of("message", "Report dismissed"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/reports/{id}/delete-message")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
        return groupMessageRepository.findById(id).map(m -> {
            m.setContent("[Message removed by admin]");
            m.setReported(false);
            groupMessageRepository.save(m);
            return ResponseEntity.ok(Map.of("message", "Message deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/reports/{id}/warn-user")
    public ResponseEntity<?> warnUser(@PathVariable Long id) {
        return groupMessageRepository.findById(id).map(m -> {
            m.setReported(false);
            groupMessageRepository.save(m);
            // In a real app, send a warning notification to the user
            return ResponseEntity.ok(Map.of("message", "User warned and report cleared"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/reports/{id}/block-user")
    public ResponseEntity<?> blockUser(@PathVariable Long id) {
        return groupMessageRepository.findById(id).map(m -> {
            if (m.getSender() != null) {
                User sender = m.getSender();
                sender.setBlocked(true);
                userRepository.save(sender);
            }
            m.setReported(false);
            groupMessageRepository.save(m);
            return ResponseEntity.ok(Map.of("message", "User blocked"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
