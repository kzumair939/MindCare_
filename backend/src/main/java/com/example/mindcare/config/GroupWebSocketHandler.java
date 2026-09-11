package com.example.mindcare.config;

import com.example.mindcare.security.JwtUtils;
import com.example.mindcare.service.GroupService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
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
public class GroupWebSocketHandler extends BaseWebSocketHandler {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    @Lazy
    private GroupService groupService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Set<WebSocketSession>> groupRooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        String path = session.getUri() != null ? session.getUri().getPath() : null;
        String roomId = getPathId(path, "/ws/group/");

        if (roomId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String username = getUsernameFromSession(session, jwtUtils);
        if (username == null) {
            log.warn("Unauthorized WebSocket connection attempt to group room {}: Missing or invalid token", roomId);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Long roomIdLong;
        try {
            roomIdLong = Long.parseLong(roomId);
        } catch (NumberFormatException e) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        if (!groupService.isMember(roomIdLong, username)) {
            log.warn("Forbidden WebSocket access attempt to group room {} by user {}", roomId, username);
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        session.getAttributes().put("username", username);
        groupRooms.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("WebSocket connected to group room {}: {} (User: {})", roomId, session.getId(), username);
        broadcastOnlineCount(roomId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String path = session.getUri() != null ? session.getUri().getPath() : null;
        String roomId = getPathId(path, "/ws/group/");
        if (roomId == null) return;

        if (!session.getAttributes().containsKey("username")) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        Set<WebSocketSession> room = groupRooms.get(roomId);
        if (room != null) {
            // Forward message (e.g. typing indicators) to all other sessions in the room
            for (WebSocketSession s : room) {
                if (s.isOpen() && !s.getId().equals(session.getId())) {
                    try {
                        synchronized (s) {
                            if (s.isOpen()) {
                                s.sendMessage(message);
                            }
                        }
                    } catch (Exception ignored) {}
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws IOException {
        String path = session.getUri() != null ? session.getUri().getPath() : null;
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
                        TextMessage tm = new TextMessage(json);
                        synchronized (s) {
                            if (s.isOpen()) {
                                s.sendMessage(tm);
                            }
                        }
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
                        TextMessage tm = new TextMessage(json);
                        synchronized (s) {
                            if (s.isOpen()) {
                                s.sendMessage(tm);
                            }
                        }
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
                        TextMessage tm = new TextMessage(json);
                        synchronized (s) {
                            if (s.isOpen()) {
                                s.sendMessage(tm);
                            }
                        }
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
                        synchronized (s) {
                            if (s.isOpen()) {
                                s.sendMessage(message);
                            }
                        }
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
                    synchronized (s) {
                        if (s.isOpen()) {
                            s.sendMessage(message);
                        }
                    }
                }
            }
        }
    }
}
