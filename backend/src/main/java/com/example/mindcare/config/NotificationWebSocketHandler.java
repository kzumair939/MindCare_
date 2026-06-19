package com.example.mindcare.config;

import org.springframework.beans.factory.annotation.Autowired;
import com.example.mindcare.security.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private JwtUtils jwtUtils;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Map<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    private String getUsernameFromSession(WebSocketSession session) {
        try {
            String query = session.getUri().getQuery();
            if (query != null && query.contains("token=")) {
                String token = query.split("token=")[1];
                if (token.contains("&")) {
                    token = token.split("&")[0];
                }
                if (jwtUtils.validateToken(token)) {
                    return jwtUtils.getUsernameFromToken(token);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse username from notification websocket token", e);
        }
        return null;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String username = getUsernameFromSession(session);
        if (username != null) {
            session.getAttributes().put("username", username);
            userSessions.computeIfAbsent(username, k -> ConcurrentHashMap.newKeySet()).add(session);
            log.info("Notification WebSocket connected for user: {}", username);
        }
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
        Set<WebSocketSession> sessions = userSessions.get(username);
        if (sessions != null) {
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    try {
                        String json = objectMapper.writeValueAsString(payload);
                        s.sendMessage(new TextMessage(json));
                    } catch (Exception e) {
                        log.error("Failed to send notification to user {}: {}", username, e.getMessage());
                    }
                }
            }
        }
    }
}
