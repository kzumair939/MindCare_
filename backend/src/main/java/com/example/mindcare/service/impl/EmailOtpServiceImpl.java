package com.example.mindcare.service.impl;

import com.example.mindcare.entity.EmailOtp;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.repository.EmailOtpRepository;
import com.example.mindcare.service.EmailOtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class EmailOtpServiceImpl implements EmailOtpService {

    private final EmailOtpRepository otpRepository;
    private final JavaMailSender mailSender;

    @Override
    @Transactional
    public void sendOtp(String email) {
        // Delete any previous OTPs for this email
        otpRepository.deleteByEmail(email);

        String otp = String.format("%06d", new Random().nextInt(1_000_000));

        EmailOtp record = EmailOtp.builder()
                .email(email)
                .otp(otp)
                .verified(false)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        otpRepository.save(record);

        System.out.println("==================================================");
        System.out.println("=== EMAIL OTP FOR " + email + ": " + otp + " ===");
        System.out.println("==================================================");

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("MindCare – Email Verification OTP");
            msg.setText("Your MindCare verification code is: " + otp + "\n\nThis code expires in 10 minutes.");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("SMTP Mail sending failed: " + e.getMessage() + ". (Ignore this if you are in local development without SMTP credentials).");
        }
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        return otpRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .map(record -> {
                    if (record.isVerified()) return false;
                    if (LocalDateTime.now().isAfter(record.getExpiresAt())) return false;
                    if (!record.getOtp().equals(otp)) return false;
                    record.setVerified(true);
                    otpRepository.save(record);
                    return true;
                })
                .orElse(false);
    }
}
