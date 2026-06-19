package com.example.mindcare.controller;

import com.example.mindcare.dto.SignupRequestDto;
import com.example.mindcare.entity.User;
import com.example.mindcare.security.JwtUtils;
import com.example.mindcare.service.UserService;
import com.example.mindcare.service.impl.CustomUserDetailService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtils jwtUtils;
    private final UserService userService;
    private final CustomUserDetailService userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {

        try {

            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.get("username"),
                            req.get("password")
                    )
            );

            String token = jwtUtils.generateToken(auth);

            User user = userService
                    .findByIdentifier(req.get("username"))
                    .orElseThrow();

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "role", user.getRole().name(),
                    "username", user.getUsername(),
                    "displayName",
                    user.getDisplayName() != null
                            ? user.getDisplayName()
                            : user.getUsername(),
                    "email", user.getEmail(),
                    "anonymousMode", user.isAnonymousMode(),
                    "freeSessionsUsed", user.getFreeSessionsUsed()
            ));

        } catch (org.springframework.security.authentication.DisabledException e) {
            String email = userService.findByIdentifier(req.get("username"))
                    .map(User::getEmail)
                    .orElse("");
            return ResponseEntity.status(401)
                    .body(Map.of(
                            "error", "Your account is not verified. Please verify your email first.",
                            "requiresVerification", true,
                            "email", email
                    ));

        } catch (BadCredentialsException e) {

            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid credentials"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody SignupRequestDto dto
    ) {

        try {

            userService.registerUser(dto);

            return ResponseEntity.ok(Map.of(
                    "message", "Verification OTP code sent to your email. Please verify to activate your account.",
                    "email", dto.getEmail()
            ));

        } catch (Exception e) {

            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {

        if (auth == null) {

            return ResponseEntity.status(401)
                    .body(Map.of("error", "Not authenticated"));
        }

        User user = userService
                .findByIdentifier(auth.getName())
                .orElseThrow();

        return ResponseEntity.ok(Map.ofEntries(

                Map.entry("id", user.getId()),
                Map.entry("username", user.getUsername()),
                Map.entry("email", user.getEmail()),
                Map.entry("role", user.getRole().name()),

                Map.entry(
                        "displayName",
                        user.getDisplayName() != null
                                ? user.getDisplayName()
                                : user.getUsername()
                ),

                Map.entry(
                        "anonymousMode",
                        user.isAnonymousMode()
                ),

                Map.entry(
                        "anonymousAlias",
                        user.getAnonymousAlias() != null
                                ? user.getAnonymousAlias()
                                : "Anonymous"
                ),

                Map.entry(
                        "freeSessionsUsed",
                        user.getFreeSessionsUsed()
                ),

                Map.entry(
                        "age",
                        user.getAge() != null
                                ? user.getAge()
                                : 0
                ),

                Map.entry(
                        "phone",
                        user.getPhone() != null
                                ? user.getPhone()
                                : ""
                ),

                Map.entry(
                        "bio",
                        user.getBio() != null
                                ? user.getBio()
                                : ""
                ),

                Map.entry(
                        "recommendedTherapy",
                        user.getRecommendedTherapy() != null
                                ? user.getRecommendedTherapy().name()
                                : "NONE"
                )
        ));
    }

    @PostMapping("/oauth2/token")
    public ResponseEntity<?> oauth2Token(
            @RequestBody Map<String, String> req
    ) {

        String email = req.get("email");

        User user = userService
                .findByIdentifier(email)
                .orElse(null);

        if (user == null) {

            return ResponseEntity.status(404)
                    .body(Map.of("error", "User not found"));
        }

        String token =
                jwtUtils.generateTokenFromUsername(user.getUsername());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", user.getRole().name(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "displayName",
                user.getDisplayName() != null
                        ? user.getDisplayName()
                        : user.getUsername()
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String otp = req.get("otp");
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
        }
        try {
            userService.verifyRegistrationOtp(email, otp);
            User user = userService.findByIdentifier(email).orElseThrow();
            String token = jwtUtils.generateTokenFromUsername(user.getUsername());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "role", user.getRole().name(),
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getUsername()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        try {
            userService.resendVerificationOtp(email);
            return ResponseEntity.ok(Map.of("message", "A new OTP has been sent to your email."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}