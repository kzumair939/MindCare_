package com.example.mindcare.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_WINDOW = 30; // Max 30 attempts per minute per IP
    private static final long WINDOW_DURATION_MILLIS = 60_000L; // 1 minute window

    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Only throttle public authentication and registration entry points
        return !(path.startsWith("/api/auth/login") ||
                 path.startsWith("/api/auth/register") ||
                 path.startsWith("/api/auth/forgot-password") ||
                 path.startsWith("/api/auth/verify-otp") ||
                 path.startsWith("/api/auth/resend-otp") ||
                 path.startsWith("/api/auth/refresh"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIp(request);
        long now = System.currentTimeMillis();

        ConcurrentLinkedQueue<Long> timestamps = requestCounts.computeIfAbsent(clientIp, k -> new ConcurrentLinkedQueue<>());

        // Evict timestamps older than the sliding window
        while (!timestamps.isEmpty() && now - timestamps.peek() > WINDOW_DURATION_MILLIS) {
            timestamps.poll();
        }

        if (timestamps.size() >= MAX_REQUESTS_PER_WINDOW) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Too many requests. Please wait a moment before trying again.\"}");
            return;
        }

        timestamps.add(now);
        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }
}
