package com.example.mindcare.service.impl;

import com.example.mindcare.entity.PasswordResetToken;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.PasswordResetTokenRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.PasswordResetService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;

    private final PasswordEncoder passwordEncoder;

    private final JavaMailSender mailSender;
    @Override
    public void createPasswordResetToken(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("No account found with this email!"));

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(12))
                .build();

        tokenRepository.save(resetToken);

        sendResetEmail(user.getEmail(), token);
    }

    private void sendResetEmail(String email, String token){
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Password Reset Request");
        message.setText(
                "To reset your password, click the link below:\n" +
                        "http://localhost:8080/reset-password?token=" + token
        );
        mailSender.send(message);
    }

    @Override
    public void resetPassword(String token, String newPassword) {

        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())){
            throw new BadRequestException("Token expired");
        }

        User user = resetToken.getUser();

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenRepository.delete(resetToken);
    }

    @Override
    public void sendResetLink(String email) {

    }
}