package com.example.mindcare.service;

import com.example.mindcare.dto.PaymentDto;
import com.example.mindcare.entity.Payment;

import java.util.List;

public interface PaymentService {
    Payment processPayment(String identifier, PaymentDto dto);
    Payment processFreeSession(String identifier, Long sessionId);
    List<Payment> getUserPayments(String identifier);
    boolean sessionNeedsPayment(String identifier, Long sessionId);
}
