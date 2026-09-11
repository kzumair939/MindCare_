package com.example.mindcare.controller;

import com.example.mindcare.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ForgotPasswordRestController {
    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgot(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email or username is required"));
        }
        try {
            passwordResetService.sendResetLink(email.trim());
            return ResponseEntity.ok(Map.of(
                    "message", "If an account with that email or username exists, a password reset code has been sent.",
                    "email", email.trim()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<?> verifyResetOtp(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String otp = req.get("otp");
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
        }
        boolean valid = passwordResetService.verifyResetOtp(email.trim(), otp.trim());
        if (valid) {
            return ResponseEntity.ok(Map.of("message", "OTP code verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP code"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> reset(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String otp = req.get("otp");
        String token = req.get("token");
        String password = req.get("password");

        if (password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password is required"));
        }

        try {
            if (email != null && !email.isBlank() && otp != null && !otp.isBlank()) {
                passwordResetService.resetPasswordWithOtp(email.trim(), otp.trim(), password);
            } else if (token != null && !token.isBlank()) {
                passwordResetService.resetPassword(token.trim(), password);
            } else if (otp != null && !otp.isBlank()) {
                passwordResetService.resetPassword(otp.trim(), password);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Email & OTP code or Token is required"));
            }
            return ResponseEntity.ok(Map.of("message", "Password has been successfully reset. Please log in with your new password."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
