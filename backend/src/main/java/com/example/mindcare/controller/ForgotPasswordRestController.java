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
    public ResponseEntity<?> forgot(@RequestBody Map<String,String> req) {
        try { passwordResetService.sendResetLink(req.get("email")); return ResponseEntity.ok(Map.of("message","Reset link sent")); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error",e.getMessage())); }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> reset(@RequestBody Map<String,String> req) {
        try { passwordResetService.resetPassword(req.get("token"), req.get("password")); return ResponseEntity.ok(Map.of("message","Password reset")); }
        catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error",e.getMessage())); }
    }
}
