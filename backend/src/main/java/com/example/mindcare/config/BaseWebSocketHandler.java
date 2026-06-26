package com.example.mindcare.config;

import com.example.mindcare.security.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Slf4j
public abstract class BaseWebSocketHandler extends TextWebSocketHandler {

    protected String getUsernameFromSession(WebSocketSession session, JwtUtils jwtUtils) {
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

    protected String getPathId(String path, String prefix) {
        if (path != null && path.startsWith(prefix)) {
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
