package com.example.mindcare.config;

import com.example.mindcare.security.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class NotificationWebSocketHandler extends BaseWebSocketHandler {

    @Autowired
    private JwtUtils jwtUtils;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Map<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String username = getUsernameFromSession(session, jwtUtils);
        if (username == null) {
            log.warn("Unauthorized notification WebSocket connection attempt");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        session.getAttributes().put("username", username);
        userSessions.computeIfAbsent(username, k -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("Notification WebSocket connected for user: {}", username);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String username = (String) session.getAttributes().get("username");
        if (username != null) {
            Set<WebSocketSession> sessions = userSessions.get(username);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(username);
                }
            }
            log.info("Notification WebSocket disconnected for user: {}", username);
        }
    }

    public void sendNotification(String username, Map<String, Object> payload) {
        if (username == null) return;
        Set<WebSocketSession> sessions = userSessions.get(username);
        if (sessions != null) {
            try {
                String json = objectMapper.writeValueAsString(payload);
                TextMessage message = new TextMessage(json);
                for (WebSocketSession s : sessions) {
                    if (s.isOpen()) {
                        try {
                            synchronized (s) {
                                if (s.isOpen()) {
                                    s.sendMessage(message);
                                }
                            }
                        } catch (Exception e) {
                            log.error("Failed to send notification to user {}: {}", username, e.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to serialize notification payload for user {}: {}", username, e.getMessage());
            }
        }
    }
}
