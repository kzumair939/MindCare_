package com.example.mindcare.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final SessionWebSocketHandler sessionWebSocketHandler;
    private final GroupWebSocketHandler groupWebSocketHandler;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:8080}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }

        registry.addHandler(sessionWebSocketHandler, "/ws/session/{id}")
                .setAllowedOrigins(origins);
        registry.addHandler(groupWebSocketHandler, "/ws/group/{roomId}")
                .setAllowedOrigins(origins);
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .setAllowedOrigins(origins);
    }
}
