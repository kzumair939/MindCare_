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
public class GroupWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private JwtUtils jwtUtils;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Set<WebSocketSession>> groupRooms = new ConcurrentHashMap<>();

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
            log.error("Failed to parse username from websocket token", e);
        }
        return null;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String path = session.getUri().getPath();
        String roomId = getPathId(path, "/ws/group/");
        if (roomId != null) {
            String username = getUsernameFromSession(session);
            if (username != null) {
                session.getAttributes().put("username", username);
            }
            groupRooms.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);
            log.info("WebSocket connected to group room {}: {} (User: {})", roomId, session.getId(), username);
            broadcastOnlineCount(roomId);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String path = session.getUri().getPath();
        String roomId = getPathId(path, "/ws/group/");
        if (roomId == null) return;

        Set<WebSocketSession> room = groupRooms.get(roomId);
        if (room != null) {
            // Forward message (e.g. typing indicators) to all other sessions in the room
            for (WebSocketSession s : room) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    s.sendMessage(message);
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws IOException {
        String path = session.getUri().getPath();
        String roomId = getPathId(path, "/ws/group/");
        if (roomId != null) {
            Set<WebSocketSession> room = groupRooms.get(roomId);
            if (room != null) {
                room.remove(session);
                if (room.isEmpty()) {
                    groupRooms.remove(roomId);
                }
            }
            log.info("WebSocket disconnected from group room {}: {}", roomId, session.getId());
            broadcastOnlineCount(roomId);
        }
    }

    public void broadcastGroupMessage(Long roomId, Map<String, Object> msgMap, String senderUsername) {
        String roomIdStr = String.valueOf(roomId);
        Set<WebSocketSession> room = groupRooms.get(roomIdStr);
        if (room != null) {
            for (WebSocketSession s : room) {
                if (s.isOpen()) {
                    try {
                        String sessionUsername = (String) s.getAttributes().get("username");
                        boolean isMine = senderUsername != null && senderUsername.equals(sessionUsername);

                        java.util.Map<String, Object> customizedMsg = new java.util.LinkedHashMap<>(msgMap);
                        customizedMsg.put("mine", isMine);

                        Map<String, Object> map = Map.of("type", "MESSAGE", "payload", customizedMsg);
                        String json = objectMapper.writeValueAsString(map);
                        s.sendMessage(new TextMessage(json));
                    } catch (Exception e) {
                        log.error("Failed to broadcast group message to session {}: {}", s.getId(), e.getMessage());
                    }
                }
            }
            log.info("Broadcasted HTTP-posted group message to {} listeners in room {}", room.size(), roomId);
        }
    }

    public void broadcastMessageEdited(Long roomId, Map<String, Object> msgMap, String senderUsername) {
        String roomIdStr = String.valueOf(roomId);
        Set<WebSocketSession> room = groupRooms.get(roomIdStr);
        if (room != null) {
            for (WebSocketSession s : room) {
                if (s.isOpen()) {
                    try {
                        String sessionUsername = (String) s.getAttributes().get("username");
                        boolean isMine = senderUsername != null && senderUsername.equals(sessionUsername);

                        java.util.Map<String, Object> customizedMsg = new java.util.LinkedHashMap<>(msgMap);
                        customizedMsg.put("mine", isMine);

                        Map<String, Object> map = Map.of("type", "MESSAGE_EDITED", "payload", customizedMsg);
                        String json = objectMapper.writeValueAsString(map);
                        s.sendMessage(new TextMessage(json));
                    } catch (Exception e) {
                        log.error("Failed to broadcast message edit to session {}: {}", s.getId(), e.getMessage());
                    }
                }
            }
        }
    }

    public void broadcastMessageDeleted(Long roomId, Long messageId) {
        String roomIdStr = String.valueOf(roomId);
        Set<WebSocketSession> room = groupRooms.get(roomIdStr);
        if (room != null) {
            for (WebSocketSession s : room) {
                if (s.isOpen()) {
                    try {
                        Map<String, Object> map = Map.of("type", "MESSAGE_DELETED", "payload", Map.of("id", messageId));
                        String json = objectMapper.writeValueAsString(map);
                        s.sendMessage(new TextMessage(json));
                    } catch (Exception e) {
                        log.error("Failed to broadcast message deletion to session {}: {}", s.getId(), e.getMessage());
                    }
                }
            }
        }
    }

    public void broadcastRoomDeleted(Long roomId) {
        String roomIdStr = String.valueOf(roomId);
        Set<WebSocketSession> room = groupRooms.get(roomIdStr);
        if (room != null) {
            Map<String, Object> map = Map.of("type", "ROOM_DELETED");
            try {
                String json = objectMapper.writeValueAsString(map);
                TextMessage message = new TextMessage(json);
                for (WebSocketSession s : room) {
                    if (s.isOpen()) {
                        s.sendMessage(message);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to broadcast room deletion for room {}: {}", roomId, e.getMessage());
            }
        }
    }

    private void broadcastOnlineCount(String roomId) throws IOException {
        Set<WebSocketSession> room = groupRooms.get(roomId);
        int count = (room != null) ? room.size() : 0;
        Map<String, Object> map = Map.of("type", "ONLINE_COUNT", "count", count);
        String json = objectMapper.writeValueAsString(map);
        TextMessage message = new TextMessage(json);
        if (room != null) {
            for (WebSocketSession s : room) {
                if (s.isOpen()) {
                    s.sendMessage(message);
                }
            }
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
