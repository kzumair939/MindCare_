package com.example.mindcare.controller;

import com.example.mindcare.dto.GroupRoomDto;
import com.example.mindcare.entity.*;
import com.example.mindcare.service.GroupService;
import com.example.mindcare.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.config.GroupWebSocketHandler;
import com.example.mindcare.config.NotificationWebSocketHandler;

@RestController
@RequestMapping("/api/group")
@RequiredArgsConstructor
@Slf4j
public class GroupRestController {
    private final GroupService groupService;
    private final UserService userService;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final GroupWebSocketHandler groupWebSocketHandler;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    private User me(Authentication auth) { return userService.findByIdentifier(auth.getName()).orElseThrow(); }

    @GetMapping("/therapist/patients")
    public ResponseEntity<?> therapistPatients(Authentication auth) {
        User me = me(auth);
        if (!me.getRole().name().equals("ROLE_THERAPIST")) {
            return ResponseEntity.status(403).body(Map.of("error", "Only therapists can view patients"));
        }
        List<Session> sessions = sessionRepository.findAllByTherapist_UserAccount_Username(me.getUsername());
        if (sessions.isEmpty()) {
            sessions = sessionRepository.findAllByTherapist_UserAccount_Email(me.getEmail());
        }
        List<Map<String,Object>> patients = sessions.stream()
            .map(Session::getUser)
            .filter(Objects::nonNull)
            .distinct()
            .map(u -> {
                Map<String,Object> map = new LinkedHashMap<>();
                map.put("id", u.getId());
                map.put("username", u.getUsername());
                map.put("email", u.getEmail());
                map.put("displayName", u.getDisplayName() != null ? u.getDisplayName() : u.getUsername());
                return map;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(patients);
    }

    @PostMapping("/{roomId}/add-patient")
    public ResponseEntity<?> addPatient(@PathVariable Long roomId, @RequestBody Map<String,Object> req, Authentication auth) {
        try {
            User me = me(auth);
            if (!me.getRole().name().equals("ROLE_THERAPIST")) {
                return ResponseEntity.status(403).body(Map.of("error", "Only therapists can add patients"));
            }
            Long patientId = Long.parseLong(req.get("patientId").toString());
            User patient = userRepository.findById(patientId).orElseThrow(() -> new NotFoundException("Patient not found"));
            List<Session> sessions = sessionRepository.findAllByTherapist_UserAccount_Username(me.getUsername());
            if (sessions.isEmpty()) {
                sessions = sessionRepository.findAllByTherapist_UserAccount_Email(me.getEmail());
            }
            boolean hasRelationship = sessions.stream()
                .anyMatch(s -> s.getUser() != null && s.getUser().getId().equals(patientId));
            if (!hasRelationship) {
                return ResponseEntity.badRequest().body(Map.of("error", "You can only invite patients who have had sessions with you."));
            }
            groupService.addMember(roomId, patient);
            return ResponseEntity.ok(Map.of("message", "Patient added successfully to the room."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/rooms")
    public ResponseEntity<?> rooms(Authentication auth) {
        String id = auth.getName(); User me = me(auth);
        boolean isTherapist = me.getRole().name().equals("ROLE_THERAPIST");
        return ResponseEntity.ok(groupService.getActiveRooms().stream().map(r -> {
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id", r.getId()); m.put("name", r.getName()); m.put("topic", r.getTopic());
            m.put("maxMembers", r.getMaxMembers()); m.put("joinCode", isTherapist ? r.getJoinCode() : null);
            m.put("isMember", groupService.isMember(r.getId(), id));
            m.put("memberCount", groupService.getRoomMembers(r.getId()).size());
            return m;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody GroupRoomDto dto, Authentication auth) {
        GroupRoom room = groupService.createRoom(auth.getName(), dto);
        return ResponseEntity.ok(Map.of("id", room.getId(), "name", room.getName(), "joinCode", room.getJoinCode()));
    }

    @PostMapping("/join")
    public ResponseEntity<?> join(@RequestBody Map<String,String> req, Authentication auth) {
        try {
            GroupRoom room = groupService.joinByCodeAndReturn(req.get("code"), auth.getName());
            return ResponseEntity.ok(Map.of("id", room.getId(), "name", room.getName(), "message","Joined!"));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<?> getRoom(@PathVariable Long roomId, Authentication auth) {
        if (!groupService.isMember(roomId, auth.getName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not a member"));
        }
        GroupRoom r = groupService.getRoom(roomId);
        if (r == null) {
            return ResponseEntity.notFound().build();
        }
        User me = me(auth);
        boolean isTherapist = me.getRole().name().equals("ROLE_THERAPIST");
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("name", r.getName());
        m.put("topic", r.getTopic());
        m.put("maxMembers", r.getMaxMembers());
        m.put("joinCode", isTherapist ? r.getJoinCode() : null);
        m.put("isMember", true);
        m.put("memberCount", groupService.getRoomMembers(r.getId()).size());
        m.put("createdByUsername", r.getCreatedBy() != null ? r.getCreatedBy().getUsername() : null);
        return ResponseEntity.ok(m);
    }

    @DeleteMapping({ "/{roomId}", "/rooms/{roomId}" })
    public ResponseEntity<?> deleteRoom(@PathVariable Long roomId, Authentication auth) {
        try {
            groupWebSocketHandler.broadcastRoomDeleted(roomId);
            groupService.deleteRoom(roomId, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping({ "/{roomId}/leave", "/rooms/{roomId}/leave" })
    public ResponseEntity<?> leaveRoom(@PathVariable Long roomId, Authentication auth) {
        try {
            groupService.leaveRoom(roomId, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Left the group successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping({ "/{roomId}/messages", "/rooms/{roomId}/messages" })
    public ResponseEntity<?> messages(@PathVariable Long roomId, @RequestParam(defaultValue="0") Long after, Authentication auth) {
        if (!groupService.isMember(roomId, auth.getName())) return ResponseEntity.status(403).body(Map.of("error","Not a member"));
        User me = me(auth);
        return ResponseEntity.ok(groupService.getRoomMessages(roomId).stream()
            .filter(m -> m.getId() > after)
            .map(m -> msgToMap(m, me))
            .collect(Collectors.toList()));
    }

    @PostMapping({ "/{roomId}/send", "/rooms/{roomId}/messages" })
    public ResponseEntity<?> send(@PathVariable Long roomId, @RequestBody Map<String,Object> req, Authentication auth) {
        try {
            boolean anon = Boolean.parseBoolean(req.getOrDefault("anonymous","false").toString());
            GroupMessage msg = groupService.sendMessage(roomId, auth.getName(), req.get("content").toString(), anon);
            Map<String, Object> msgMap = msgToMap(msg, me(auth));
            groupWebSocketHandler.broadcastGroupMessage(roomId, msgMap, msg.getSender() != null ? msg.getSender().getUsername() : null);
            sendGroupMessageNotification(roomId, msg.getRoom().getName(), me(auth), msg.getContent(), anon);
            return ResponseEntity.ok(msgMap);
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping({ "/{roomId}/upload", "/rooms/{roomId}/upload" })
    public ResponseEntity<?> upload(@PathVariable Long roomId, @RequestParam MultipartFile file,
                                    @RequestParam(defaultValue="false") boolean anonymous, Authentication auth) {
        if (!groupService.isMember(roomId, auth.getName())) return ResponseEntity.status(403).body(Map.of("error","Not a member"));
        try {
            String orig = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String ext  = orig.contains(".") ? orig.substring(orig.lastIndexOf(".")) : "";
            String stored = UUID.randomUUID() + ext;
            Path dir = Paths.get("uploads/group-files");
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
            String url = "/uploads/group-files/" + stored;
            String ct  = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            String label = ct.startsWith("image/") ? "[IMAGE]" : ct.startsWith("video/") ? "[VIDEO]"
                : ct.startsWith("audio/") ? "[VOICE]" : ct.equals("application/pdf") ? "[PDF]" : "[FILE]";
            GroupMessage msg = groupService.sendMessage(roomId, auth.getName(), "[FILE:"+label+":"+url+":"+orig+"]", anonymous);
            Map<String, Object> msgMap = msgToMap(msg, me(auth));
            groupWebSocketHandler.broadcastGroupMessage(roomId, msgMap, msg.getSender() != null ? msg.getSender().getUsername() : null);
            sendGroupMessageNotification(roomId, msg.getRoom().getName(), me(auth), msg.getContent(), anonymous);
            return ResponseEntity.ok(msgMap);
        } catch (IOException e) { return ResponseEntity.badRequest().body(Map.of("error","Upload failed: "+e.getMessage())); }
    }

    private void sendGroupMessageNotification(Long roomId, String roomName, User sender, String content, boolean anonymous) {
        try {
            List<User> members = groupService.getRoomMembers(roomId);
            String senderName = anonymous ? "Anonymous" : (sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername());
            String textContent = content != null ? content : "";
            if (textContent.startsWith("[FILE:")) {
                textContent = "sent an attachment";
            }
            Map<String, Object> payload = Map.of(
                "type", "GROUP_MESSAGE",
                "roomId", roomId,
                "roomName", roomName,
                "senderName", senderName,
                "content", textContent
            );
            for (User member : members) {
                if (!member.getUsername().equals(sender.getUsername())) {
                    notificationWebSocketHandler.sendNotification(member.getUsername(), payload);
                }
            }
        } catch (Exception e) {
            log.error("Failed to send group message notification", e);
        }
    }

    @PostMapping("/{roomId}/invite")
    public ResponseEntity<?> invite(@PathVariable Long roomId, @RequestBody Map<String,String> req, Authentication auth) {
        try {
            groupService.inviteByEmail(roomId, auth.getName(), req.get("email"));
            return ResponseEntity.ok(Map.of("message","Invite sent"));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error",e.getMessage())); }
    }

    @GetMapping("/join/invite")
    public ResponseEntity<?> acceptInvite(@RequestParam String token, Authentication auth) {
        try {
            GroupRoom room = groupService.acceptInvite(token, auth.getName());
            return ResponseEntity.ok(Map.of("id", room.getId(), "name", room.getName()));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error",e.getMessage())); }
    }

    @GetMapping("/{roomId}/members")
    public ResponseEntity<?> members(@PathVariable Long roomId, Authentication auth) {
        if (!groupService.isMember(roomId, auth.getName())) return ResponseEntity.status(403).body(Map.of("error","Not a member"));
        return ResponseEntity.ok(groupService.getRoomMembers(roomId).stream().map(u -> Map.of(
            "id", u.getId(), "username", u.getUsername(),
            "displayName", u.getDisplayName() != null ? u.getDisplayName() : u.getUsername()
        )).collect(Collectors.toList()));
    }

    @PostMapping("/message/{id}/report")
    public ResponseEntity<?> report(@PathVariable Long id, @RequestBody Map<String,String> req) {
        groupService.reportMessage(id, req.getOrDefault("reason","Abusive language"));
        return ResponseEntity.ok(Map.of("message","Reported"));
    }

    @PutMapping("/message/{messageId}")
    public ResponseEntity<?> editMessage(@PathVariable Long messageId, @RequestBody Map<String,String> req, Authentication auth) {
        try {
            String newContent = req.get("content");
            GroupMessage msg = groupService.editMessage(messageId, newContent, auth.getName());
            Map<String, Object> msgMap = msgToMap(msg, me(auth));
            groupWebSocketHandler.broadcastMessageEdited(msg.getRoom().getId(), msgMap, auth.getName());
            return ResponseEntity.ok(msgMap);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/message/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long messageId, Authentication auth) {
        try {
            GroupMessage msg = groupService.deleteMessage(messageId, auth.getName());
            groupWebSocketHandler.broadcastMessageDeleted(msg.getRoom().getId(), messageId);
            return ResponseEntity.ok(Map.of("message", "Message deleted successfully", "id", messageId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String,Object> msgToMap(GroupMessage m, User me) {
        Map<String,Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("content", m.getContent());
        map.put("anonymous", m.isAnonymous());
        map.put("senderName", m.isAnonymous() ? m.getAnonymousAlias()
            : (m.getSender() != null ? (m.getSender().getDisplayName() != null ? m.getSender().getDisplayName() : m.getSender().getUsername()) : "?"));
        // Always include the real username so the client can determine `mine` locally
        map.put("senderUsername", m.getSender() != null ? m.getSender().getUsername() : null);
        map.put("sentAt", m.getSentAt() != null ? m.getSentAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        map.put("mine", m.getSender() != null && m.getSender().getId().equals(me.getId()));
        map.put("edited", m.isEdited());
        map.put("deleted", m.isDeleted());
        return map;
    }
}
