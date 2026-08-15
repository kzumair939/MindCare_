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
                existingAdmin.setPassword(passwordEncoder.encode(adminPassword));
                existingAdmin.setRole(Role.ROLE_ADMIN);
                existingAdmin.setEnabled(true);
                userRepository.save(existingAdmin);
                System.out.println("[MindCare] Existing Admin user updated & enabled: " + adminUsername);
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
    }

}
