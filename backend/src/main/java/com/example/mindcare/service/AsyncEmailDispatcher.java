package com.example.mindcare.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Dedicated asynchronous email dispatcher.
 * Offloads SMTP network I/O from Tomcat request threads to the mailExecutor thread pool.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncEmailDispatcher {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Async("mailExecutor")
    public void sendHtmlEmailAsync(String to, String subject, String htmlContent, String plainFallback) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            if (senderEmail != null && !senderEmail.isBlank()) {
                helper.setFrom(senderEmail, "MindCare Support");
            } else {
                helper.setFrom("noreply@mindcare.com", "MindCare Support");
            }

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Asynchronous HTML email sent successfully to {}", to);
        } catch (Exception e) {
            log.warn("HTML email failed ({}), attempting plain-text fallback to {}...", e.getMessage(), to);
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                if (senderEmail != null && !senderEmail.isBlank()) {
                    msg.setFrom(senderEmail);
                }
                msg.setTo(to);
                msg.setSubject(subject);
                msg.setText(plainFallback != null ? plainFallback : "Please check your MindCare notifications.");
                mailSender.send(msg);
                log.info("Plain-text email sent successfully to {}", to);
            } catch (Exception ex) {
                log.warn("Asynchronous SMTP Mail sending failed for {}: {}", to, ex.getMessage());
            }
        }
    }

    @Async("mailExecutor")
    public void sendSimpleEmailAsync(String to, String subject, String body) {
        if (to == null || to.isBlank()) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (senderEmail != null && !senderEmail.isBlank()) {
                message.setFrom(senderEmail);
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Asynchronous simple email sent to {}", to);
        } catch (Exception e) {
            log.warn("Could not send asynchronous simple email to {}: {}", to, e.getMessage());
        }
    }
}
