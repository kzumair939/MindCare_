package com.example.mindcare.config;

import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.SessionMessage;
import com.example.mindcare.entity.User;
import com.example.mindcare.repository.SessionMessageRepository;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.security.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class SessionWebSocketHandler extends BaseWebSocketHandler {

    private final SessionRepository sessionRepository;
    private final SessionMessageRepository sessionMessageRepository;
    private final JwtUtils jwtUtils;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, Set<WebSocketSession>> sessionRooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String path = session.getUri() != null ? session.getUri().getPath() : null;
        String sessionIdStr = getPathId(path, "/ws/session/");

        if (sessionIdStr == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String username = getUsernameFromSession(session, jwtUtils);
        if (username == null) {
            log.warn("Unauthorized WebSocket connection attempt to session {}: Missing or invalid token", sessionIdStr);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Long sessionId;
        try {
            sessionId = Long.parseLong(sessionIdStr);
        } catch (NumberFormatException e) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        Session sessionEntity = sessionRepository.findByIdWithDetails(sessionId).orElse(null);
        if (sessionEntity == null) {
            log.warn("WebSocket connection attempt for non-existent session {}", sessionId);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        boolean isPatient = sessionEntity.getUser() != null &&
                (username.equalsIgnoreCase(sessionEntity.getUser().getUsername()) ||
                 username.equalsIgnoreCase(sessionEntity.getUser().getEmail()));

        boolean isTherapist = sessionEntity.getTherapist() != null &&
                (username.equalsIgnoreCase(sessionEntity.getTherapist().getEmail()) ||
                 username.equalsIgnoreCase(sessionEntity.getTherapist().getName()) ||
                 (sessionEntity.getTherapist().getUserAccount() != null &&
                  (username.equalsIgnoreCase(sessionEntity.getTherapist().getUserAccount().getUsername()) ||
                   username.equalsIgnoreCase(sessionEntity.getTherapist().getUserAccount().getEmail()))));

        if (!isPatient && !isTherapist) {
            log.warn("Forbidden WebSocket access attempt to session {} by user {}", sessionId, username);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        session.getAttributes().put("username", username);
        session.getAttributes().put("isTherapist", isTherapist);

        Set<WebSocketSession> room = sessionRooms.computeIfAbsent(sessionIdStr, k -> ConcurrentHashMap.newKeySet());
        room.add(session);
        log.info("WebSocket connection established for session {}: user={}, wsId={}", sessionId, username, session.getId());

        for (WebSocketSession s : room) {
            if (s.isOpen() && !s.getId().equals(session.getId())) {
                try {
                    synchronized (s) {
                        if (s.isOpen()) {
                            s.sendMessage(new TextMessage("{\"type\":\"peer-joined\"}"));
                        }
                    }
                } catch (IOException ignored) {}
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String path = session.getUri() != null ? session.getUri().getPath() : null;
        String sessionIdStr = getPathId(path, "/ws/session/");
        if (sessionIdStr == null) return;

        String senderUsername = (String) session.getAttributes().get("username");
        if (senderUsername == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Set<WebSocketSession> room = sessionRooms.get(sessionIdStr);
        if (room != null) {
            String payload = message.getPayload();

            for (WebSocketSession s : room) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    try {
                        synchronized (s) {
                            if (s.isOpen()) {
                                s.sendMessage(message);
                            }
                        }
                    } catch (IOException ignored) {}
                }
            }

            try {
                Map<String, Object> data = objectMapper.readValue(payload, Map.class);
                if (data != null && "chat".equals(data.get("type"))) {
                    Map<String, Object> msgMap = (Map<String, Object>) data.get("message");
                    if (msgMap != null) {
                        String content = (String) msgMap.get("content");
                        Long sessionId = Long.parseLong(sessionIdStr);

                        Session sessionEntity = sessionRepository.findById(sessionId).orElse(null);
                        if (sessionEntity != null && content != null && !content.isBlank()) {
                            SessionMessage sessionMessage = SessionMessage.builder()
                                    .session(sessionEntity)
                                    .senderName(senderUsername)
                                    .content(content)
                                    .sentAt(LocalDateTime.now())
                                    .build();
                            sessionMessageRepository.save(sessionMessage);
                            log.info("Saved private message for session {} from user {}", sessionId, senderUsername);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error processing/persisting session message: {}", e.getMessage());
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String path = session.getUri() != null ? session.getUri().getPath() : null;
        String sessionId = getPathId(path, "/ws/session/");
        if (sessionId != null) {
            Set<WebSocketSession> room = sessionRooms.get(sessionId);
            if (room != null) {
                room.remove(session);
                for (WebSocketSession s : room) {
                    if (s.isOpen()) {
                        try {
                            s.sendMessage(new TextMessage("{\"type\":\"peer-left\"}"));
                        } catch (IOException ignored) {}
                    }
                }
                if (room.isEmpty()) {
                    sessionRooms.remove(sessionId);
                }
            }
            log.info("WebSocket connection closed for session {}: {}", sessionId, session.getId());
        }
    }
}
