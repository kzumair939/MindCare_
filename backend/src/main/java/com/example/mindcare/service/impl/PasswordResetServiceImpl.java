package com.example.mindcare.service.impl;

import com.example.mindcare.entity.PasswordResetToken;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.PasswordResetTokenRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.AsyncEmailDispatcher;
import com.example.mindcare.service.PasswordResetService;
import com.example.mindcare.validation.PasswordStrengthValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final com.example.mindcare.repository.RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AsyncEmailDispatcher emailDispatcher;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.frontend.url:http://localhost:8080}")
    private String frontendUrl;

    @Override
    public void createPasswordResetToken(String email) {
        String cleanEmail = email != null ? email.trim() : "";
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .or(() -> userRepository.findByUsernameIgnoreCase(cleanEmail))
                .orElseThrow(() -> new NotFoundException("No account found with this email or username: " + cleanEmail));

        // Generate 6-digit numeric OTP
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));

        // Find existing token for user or build new entity to prevent unique key constraint violations
        PasswordResetToken resetToken = tokenRepository.findTopByUserOrderByExpiryDateDesc(user)
                .orElseGet(() -> PasswordResetToken.builder().user(user).build());

        resetToken.setUser(user);
        resetToken.setToken(otp);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));

        tokenRepository.saveAndFlush(resetToken);

        log.info("[MINDCARE PASSWORD RESET OTP SERVICE] Password reset OTP generated and dispatched to {} (Expires in 15 minutes)", user.getEmail());
        log.info("[MINDCARE PASSWORD RESET OTP] User: {}, OTP Code: {}", user.getEmail(), otp);

        // Send Email Asynchronously
        String html = buildResetHtml(otp);
        String plain = "Hello,\n\nWe received a request to reset your MindCare account password.\n\nYour One-Time Password (OTP) reset code is:\n\n    "
                + otp + "\n\nThis code will expire in 15 minutes.\n\nBest regards,\nMindCare Support Team";
        emailDispatcher.sendHtmlEmailAsync(user.getEmail(), "MindCare Password Reset Code: " + otp, html, plain);
    }

    private String buildResetHtml(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>MindCare Password Reset Code</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7fb; padding: 40px 10px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #4f46e5, #3b82f6); padding: 30px; text-align: center; color: #ffffff;">
                                            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MindCare</h1>
                                            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Account Security & Recovery</p>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 36px 30px;">
                                            <h2 style="margin: 0 0 14px; font-size: 18px; color: #1e293b; font-weight: 700;">Reset Your Password</h2>
                                            <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; line-height: 1.6;">
                                                We received a request to reset your MindCare account password. Use the 6-digit OTP code below to set a new password:
                                            </p>
                                            
                                            <!-- OTP Card -->
                                            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                                                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">%s</span>
                                                <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8; font-weight: 600;">Valid for 15 minutes</p>
                                            </div>

                                            <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; line-height: 1.5;">
                                                If you did not request this password reset, please ignore this email or contact support if you have concerns.
                                            </p>
                                        </td>
                                    </tr>
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                                            &copy; MindCare Wellness Platform • All rights reserved.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(otp);
    }

    @Override
    public boolean verifyResetOtp(String email, String otp) {
        if (email == null || otp == null) return false;
        String cleanEmail = email.trim();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .or(() -> userRepository.findByUsernameIgnoreCase(cleanEmail))
                .orElse(null);
        if (user == null) return false;

        return tokenRepository.findTopByUserOrderByExpiryDateDesc(user)
                .map(t -> !t.getExpiryDate().isBefore(LocalDateTime.now()) && t.getToken().trim().equals(otp.trim()))
                .orElse(false);
    }

    @Override
    public void resetPasswordWithOtp(String email, String otp, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (otp == null || otp.isBlank()) {
            throw new BadRequestException("OTP code is required");
        }

        String cleanEmail = email.trim();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .or(() -> userRepository.findByUsernameIgnoreCase(cleanEmail))
                .orElseThrow(() -> new NotFoundException("No account found with this email or username: " + cleanEmail));

        PasswordResetToken resetToken = tokenRepository.findTopByUserOrderByExpiryDateDesc(user)
                .orElseThrow(() -> new BadRequestException("No password reset request found. Please request a new OTP."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            throw new BadRequestException("Password reset OTP has expired. Please request a new one.");
        }

        if (!resetToken.getToken().trim().equals(otp.trim())) {
            throw new BadRequestException("Invalid OTP code. Please check and try again.");
        }

        if (newPassword == null || !PasswordStrengthValidator.isStrong(newPassword)) {
            throw new BadRequestException("Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character (@#$!)");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Security: Invalidate all existing sessions and refresh tokens on password change
        refreshTokenRepository.revokeAllForUser(user, LocalDateTime.now());

        tokenRepository.delete(resetToken);
        log.info("Password successfully reset via OTP for user {}", user.getUsername());
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Token/OTP is required");
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(token.trim())
                .orElseThrow(() -> new BadRequestException("Invalid or expired password reset token/OTP"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(resetToken);
            throw new BadRequestException("Password reset token has expired");
        }

        if (newPassword == null || !PasswordStrengthValidator.isStrong(newPassword)) {
            throw new BadRequestException("Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character (@#$!)");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Security: Invalidate all existing sessions and refresh tokens on password change
        refreshTokenRepository.revokeAllForUser(user, LocalDateTime.now());

        tokenRepository.delete(resetToken);
        log.info("Password successfully reset for user {}", user.getUsername());
    }

    @Override
    public void sendResetLink(String email) {
        try {
            createPasswordResetToken(email);
        } catch (NotFoundException e) {
            // OWASP Account Enumeration Mitigation:
            // Do not reveal whether the account exists; silently return
            log.info("Password reset requested for non-existent account: {}", email);
        }
    }
}