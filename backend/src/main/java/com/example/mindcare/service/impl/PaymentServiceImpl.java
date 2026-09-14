package com.example.mindcare.service.impl;

import com.example.mindcare.dto.PaymentDto;
import com.example.mindcare.entity.Payment;
import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.PaymentRepository;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Override
    public synchronized Payment processPayment(String identifier, PaymentDto dto) {
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new NotFoundException("User not found"));

        Session session = sessionRepository.findByIdWithDetails(dto.getSessionId())
                .orElseThrow(() -> new NotFoundException("Session not found"));

        // Enforce ownership: Only the patient assigned to this session can process payment
        if (session.getUser() == null || !session.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You are not authorized to process payment for this session");
        }

        // Check if already paid
        if (paymentRepository.findBySessionId(dto.getSessionId()).isPresent()) {
            throw new BadRequestException("Session already paid");
        }

        // Simulate Stripe payment - generate a fake payment intent ID
        String fakePaymentIntentId = "pi_fake_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);

        Payment payment = Payment.builder()
                .session(session)
                .user(user)
                .amount(Math.toIntExact(dto.getAmount() != null ? dto.getAmount() : session.getFeeAmount()))
                .currency("USD")
                .stripePaymentIntentId(fakePaymentIntentId)
                .status("succeeded")
                .freeSession(false)
                .build();

        return paymentRepository.save(payment);
    }

    @Override
    public synchronized Payment processFreeSession(String identifier, Long sessionId) {
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (user.getFreeSessionsUsed() >= 2) {
            throw new BadRequestException("No free sessions remaining");
        }

        Session session = sessionRepository.findByIdWithDetails(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        // Enforce ownership: Only the patient assigned to this session can apply free session credits
        if (session.getUser() == null || !session.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You are not authorized to apply free session credits to this session");
        }

        if (paymentRepository.findBySessionId(sessionId).isPresent()) {
            throw new BadRequestException("Session already has payment registered");
        }

        user.setFreeSessionsUsed(user.getFreeSessionsUsed() + 1);
        userRepository.save(user);

        Payment payment = Payment.builder()
                .session(session)
                .user(user)
                .amount(0)
                .currency("USD")
                .stripePaymentIntentId("free_session_" + sessionId)
                .status("succeeded")
                .freeSession(true)
                .build();

        return paymentRepository.save(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Payment> getUserPayments(String identifier) {
        User user = userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new NotFoundException("User not found"));
        return paymentRepository.findByUserId(user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean sessionNeedsPayment(String identifier, Long sessionId) {
        return paymentRepository.findBySessionId(sessionId).isEmpty();
    }
}
