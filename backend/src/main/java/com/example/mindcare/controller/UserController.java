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
        if (newPw == null || newPw.length() < 8) {
            return ResponseEntity.status(400).body(Map.of("error", "New password must be at least 8 characters"));
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
            String uploadDir = System.getProperty("user.dir") + "/uploads/profile-pictures/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();
            String ext = "";
            String origName = profilePicture.getOriginalFilename();
            if (origName != null && origName.contains(".")) {
                ext = origName.substring(origName.lastIndexOf("."));
            }
            String fileName = "user_" + user.getId() + "_" + UUID.randomUUID().toString().substring(0,8) + ext;
            Path dest = Paths.get(uploadDir + fileName);
            Files.write(dest, profilePicture.getBytes());
            user.setProfilePicturePath(uploadDir + fileName);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("path", uploadDir + fileName, "message", "Profile picture uploaded"));
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
