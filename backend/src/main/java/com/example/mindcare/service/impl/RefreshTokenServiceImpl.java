package com.example.mindcare.service.impl;

import com.example.mindcare.entity.RefreshToken;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.RefreshTokenRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.security.JwtUtils;
import com.example.mindcare.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.jwt.refresh-expiration-days:7}")
    private int refreshExpirationDays;

    @Override
    @Transactional
    public RefreshToken createRefreshToken(String userIdentifier) {
        User user = userRepository.findByEmail(userIdentifier)
                .or(() -> userRepository.findByUsername(userIdentifier))
                .orElseThrow(() -> new NotFoundException("User not found"));

        String rawToken = generateSecureTokenString();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(rawToken)
                .expiryDate(LocalDateTime.now().plusDays(refreshExpirationDays))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public Map<String, String> rotateRefreshToken(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BadRequestException("Refresh token is required");
        }

        RefreshToken oldToken = refreshTokenRepository.findByToken(rawRefreshToken.trim())
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        User user = oldToken.getUser();

        // 1. Security Reuse Detection (Token Replay Attack Mitigation)
        if (oldToken.isRevoked()) {
            log.warn("SECURITY ALERT: Refresh token reuse attempt detected for user: {}. Invalidating all active tokens.", user.getUsername());
            refreshTokenRepository.revokeAllForUser(user, LocalDateTime.now());
            throw new BadRequestException("Security alert: Attempted reuse of revoked refresh token. All active sessions have been invalidated. Please log in again.");
        }

        // 2. Expiration Check
        if (oldToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            oldToken.setRevoked(true);
            oldToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(oldToken);
            throw new BadRequestException("Refresh token has expired. Please log in again.");
        }

        // 3. Rotate: Mark old token revoked and link to new token
        String newRawToken = generateSecureTokenString();
        oldToken.setRevoked(true);
        oldToken.setRevokedAt(LocalDateTime.now());
        oldToken.setReplacedByToken(newRawToken);
        refreshTokenRepository.save(oldToken);

        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .token(newRawToken)
                .expiryDate(LocalDateTime.now().plusDays(refreshExpirationDays))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newRefreshToken);

        // 4. Issue new short-lived access token (15-minute validity)
        String newAccessToken = jwtUtils.generateTokenFromUsername(user.getUsername());

        log.info("Successfully rotated refresh token for user: {}", user.getUsername());

        return Map.of(
                "token", newAccessToken,
                "refreshToken", newRawToken
        );
    }

    @Override
    @Transactional
    public void revokeToken(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenRepository.findByToken(rawRefreshToken.trim()).ifPresent(token -> {
                token.setRevoked(true);
                token.setRevokedAt(LocalDateTime.now());
                refreshTokenRepository.save(token);
                log.info("Revoked refresh token for user: {}", token.getUser().getUsername());
            });
        }
    }

    @Override
    @Transactional
    public void revokeAllForUser(String userIdentifier) {
        userRepository.findByEmail(userIdentifier)
                .or(() -> userRepository.findByUsername(userIdentifier))
                .ifPresent(user -> {
                    refreshTokenRepository.revokeAllForUser(user, LocalDateTime.now());
                    log.info("Revoked all active refresh tokens for user: {}", user.getUsername());
                });
    }

    private String generateSecureTokenString() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return UUID.randomUUID().toString() + "_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
