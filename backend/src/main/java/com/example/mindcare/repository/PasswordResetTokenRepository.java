package com.example.mindcare.repository;

import com.example.mindcare.entity.PasswordResetToken;
import com.example.mindcare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUser(User user);
    Optional<PasswordResetToken> findTopByUserOrderByExpiryDateDesc(User user);
    void deleteByUser(User user);
}