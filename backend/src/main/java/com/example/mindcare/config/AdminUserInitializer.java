package com.example.mindcare.config;

import com.example.mindcare.Enum.Role;
import com.example.mindcare.entity.User;
import com.example.mindcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class AdminUserInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username:admin}")
    private String adminUsername;
    @Value("${admin.password:admin123}")
    private String adminPassword;
    @Value("${app.admin.email:admin@example.com}")
    private String adminEmail;

    @Override
    public void run(ApplicationArguments args) {
        userRepository.findByUsername(adminUsername).ifPresentOrElse(
            existingAdmin -> {
                existingAdmin.setEnabled(true);
                existingAdmin.setPassword(passwordEncoder.encode(adminPassword));
                userRepository.save(existingAdmin);
                log.info("[MindCare] Existing Admin user verified and refreshed: {}", adminUsername);
            },
            () -> {
                User admin = User.builder()
                    .username(adminUsername)
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ROLE_ADMIN)
                    .displayName("Admin")
                    .enabled(true)
                    .freeSessionsUsed(0)
                    .anonymousMode(false)
                    .build();
                userRepository.save(admin);
                System.out.println("[MindCare] Admin user created & enabled: " + adminUsername);
            }
        );

        // Ensure Hamdan therapist user account is enabled and has valid password
        userRepository.findByUsername("Hamdan").ifPresent(hamdan -> {
            hamdan.setEmail("hamdan@gmail.com");
            hamdan.setDisplayName("Hamdan");
            hamdan.setEnabled(true);
            hamdan.setBlocked(false);
            hamdan.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(hamdan);
            log.info("[MindCare] Therapist Hamdan user verified and password set to admin123");
        });
    }

}
