package com.example.mindcare.controller;

import com.example.mindcare.dto.UserProfileDto;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserProfileDto dto, Authentication auth) {
        userService.updateProfile(auth.getName(), dto);
        return ResponseEntity.ok(Map.of("message","Profile updated"));
    }

    @PostMapping("/toggle-anonymous")
    public ResponseEntity<?> toggleAnonymous(Authentication auth) {
        userService.toggleAnonymousMode(auth.getName());
        User user = userService.findByIdentifier(auth.getName()).orElseThrow();
        return ResponseEntity.ok(Map.of("anonymousMode", user.isAnonymousMode(),
            "anonymousAlias", user.getAnonymousAlias() != null ? user.getAnonymousAlias() : ""));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String,String> req, Authentication auth) {
        User user = userService.findByIdentifier(auth.getName())
            .orElseThrow(() -> new BadRequestException("User not found"));
        String currentPw = req.get("currentPassword");
        String newPw = req.get("newPassword");
        if (!passwordEncoder.matches(currentPw, user.getPassword())) {
            return ResponseEntity.status(400).body(Map.of("error", "Current password is incorrect"));
        }
        if (newPw == null || !com.example.mindcare.validation.PasswordStrengthValidator.isStrong(newPw)) {
            return ResponseEntity.status(400).body(Map.of("error", "Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character (@#$!)"));
        }
        user.setPassword(passwordEncoder.encode(newPw));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(@RequestParam MultipartFile profilePicture, Authentication auth) {
        User user = userService.findByIdentifier(auth.getName())
            .orElseThrow(() -> new BadRequestException("User not found"));
        try {
            String origName = profilePicture.getOriginalFilename();
            String ext = "";
            if (origName != null && origName.contains(".")) {
                ext = origName.substring(origName.lastIndexOf(".")).toLowerCase();
            }
            java.util.Set<String> allowed = java.util.Set.of(".jpg", ".jpeg", ".png", ".webp");
            if (!allowed.contains(ext)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only image files (.jpg, .jpeg, .png, .webp) are allowed"));
            }

            Path uploadDir = Paths.get("uploads/profile-pictures");
            Files.createDirectories(uploadDir);

            String fileName = "user_" + user.getId() + "_" + UUID.randomUUID().toString().substring(0,8) + ext;
            Path dest = uploadDir.resolve(fileName);
            Files.write(dest, profilePicture.getBytes());

            String webPath = "/uploads/profile-pictures/" + fileName;
            user.setProfilePicturePath(webPath);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("path", webPath, "message", "Profile picture uploaded"));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload picture"));
        }
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(Authentication auth) {
        userService.deleteAccount(auth.getName());
        return ResponseEntity.ok(Map.of("message","Account deleted"));
    }
}
