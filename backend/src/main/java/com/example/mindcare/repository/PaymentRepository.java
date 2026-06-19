package com.example.mindcare.repository;

import com.example.mindcare.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserId(Long userId);
    Optional<Payment> findBySessionId(Long sessionId);
    long countByUserIdAndFreeSessionFalseAndStatus(Long userId, String status);
}
