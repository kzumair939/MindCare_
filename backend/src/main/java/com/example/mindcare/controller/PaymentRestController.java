package com.example.mindcare.controller;

import com.example.mindcare.dto.PaymentDto;
import com.example.mindcare.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentRestController {
    private final PaymentService paymentService;

    @PostMapping("/pay")
    public ResponseEntity<?> pay(@RequestBody PaymentDto dto, Authentication auth) {
        try {
            paymentService.processPayment(auth.getName(), dto);
            return ResponseEntity.ok(Map.of("message","Payment successful"));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error",e.getMessage())); }
    }

    @PostMapping("/free/{sessionId}")
    public ResponseEntity<?> free(@PathVariable Long sessionId, Authentication auth) {
        try {
            paymentService.processFreeSession(auth.getName(), sessionId);
            return ResponseEntity.ok(Map.of("message","Free session applied"));
        } catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error",e.getMessage())); }
    }
}
