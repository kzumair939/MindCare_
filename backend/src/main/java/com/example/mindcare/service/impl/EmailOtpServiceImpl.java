package com.example.mindcare.service.impl;

import com.example.mindcare.entity.EmailOtp;
import com.example.mindcare.repository.EmailOtpRepository;
import com.example.mindcare.service.AsyncEmailDispatcher;
import com.example.mindcare.service.EmailOtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailOtpServiceImpl implements EmailOtpService {

    private final EmailOtpRepository otpRepository;
    private final AsyncEmailDispatcher emailDispatcher;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public void sendOtp(String email) {
        // Delete any previous OTPs for this email
        otpRepository.deleteByEmail(email);

        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));

        EmailOtp record = EmailOtp.builder()
                .email(email)
                .otp(otp)
                .verified(false)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        otpRepository.save(record);

        // Secure logging: Do not leak plain OTP in production INFO logs
        log.info("[MINDCARE OTP SERVICE] Verification OTP code generated and dispatched to {} (Expires in 10 minutes)", email);
        log.debug("[MINDCARE OTP SERVICE DEBUG] Email: {}, OTP: {}", email, otp);

        String htmlContent = buildOtpHtml(otp);
        String plainText = "Hello,\n\nYour MindCare verification code is: " + otp + "\n\nThis code expires in 10 minutes.\n\nBest regards,\nMindCare Team";
        emailDispatcher.sendHtmlEmailAsync(email, "Your MindCare Verification Code: " + otp, htmlContent, plainText);
    }

    private String buildOtpHtml(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>MindCare Verification Code</title>
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
                                             <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Personalized Mental Wellness & Care</p>
                                        </td>
                                    </tr>
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 36px 30px;">
                                            <h2 style="margin: 0 0 14px; font-size: 18px; color: #1e293b; font-weight: 700;">Verify Your Email Address</h2>
                                            <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; line-height: 1.6;">
                                                Thank you for creating an account with MindCare. Please use the verification code below to complete your registration and activate your account.
                                            </p>
                                            
                                            <!-- OTP Card -->
                                            <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                                                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">%s</span>
                                                <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8; font-weight: 600;">Valid for 10 minutes</p>
                                            </div>

                                            <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; line-height: 1.5;">
                                                If you did not initiate this request, you can safely ignore this message.
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
