package com.example.mindcare.config;

import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.SessionMessage;
import com.example.mindcare.repository.SessionMessageRepository;
import com.example.mindcare.repository.SessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class SessionWebSocketHandler extends TextWebSocketHandler {

    private final SessionRepository sessionRepository;
    private final SessionMessageRepository sessionMessageRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Map of sessionId -> Set of active WebSocket sessions
    private final Map<String, Set<WebSocketSession>> sessionRooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String path = session.getUri().getPath();
        String sessionId = getPathId(path, "/ws/session/");
        if (sessionId != null) {
            Set<WebSocketSession> room = sessionRooms.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet());
            room.add(session);
            log.info("WebSocket connection established for session {}: {}", sessionId, session.getId());

            // Broadcast peer-joined to other sessions in the room
            for (WebSocketSession s : room) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    try {
                        s.sendMessage(new TextMessage("{\"type\":\"peer-joined\"}"));
                    } catch (IOException ignored) {}
                }
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String path = session.getUri().getPath();
        String sessionIdStr = getPathId(path, "/ws/session/");
        if (sessionIdStr == null) return;

        Set<WebSocketSession> room = sessionRooms.get(sessionIdStr);
        if (room != null) {
            String payload = message.getPayload();

            // 1. Broadcast to other peer in the room
            for (WebSocketSession s : room) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    s.sendMessage(message);
                }
            }

            // 2. Parse and persist chat messages in the database
            try {
                Map<String, Object> data = objectMapper.readValue(payload, Map.class);
                if (data != null && "chat".equals(data.get("type"))) {
                    Map<String, Object> msgMap = (Map<String, Object>) data.get("message");
                    if (msgMap != null) {
                        String sender = (String) msgMap.get("sender");
                        String content = (String) msgMap.get("content");
                        Long sessionId = Long.parseLong(sessionIdStr);

                        Session sessionEntity = sessionRepository.findById(sessionId).orElse(null);
                        if (sessionEntity != null) {
                            SessionMessage sessionMessage = SessionMessage.builder()
                                    .session(sessionEntity)
                                    .senderName(sender)
                                    .content(content)
                                    .sentAt(LocalDateTime.now())
                                    .build();
                            sessionMessageRepository.save(sessionMessage);
                            log.info("Saved private message for session {}", sessionId);
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
        String path = session.getUri().getPath();
        String sessionId = getPathId(path, "/ws/session/");
        if (sessionId != null) {
            Set<WebSocketSession> room = sessionRooms.get(sessionId);
            if (room != null) {
                room.remove(session);
                // Broadcast peer-left to other sessions in the room
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

    private String getPathId(String path, String prefix) {
        if (path.startsWith(prefix)) {
            String sub = path.substring(prefix.length());
            int slash = sub.indexOf("/");
            if (slash != -1) {
                return sub.substring(0, slash);
            }
            return sub;
        }
        return null;
    }
}
