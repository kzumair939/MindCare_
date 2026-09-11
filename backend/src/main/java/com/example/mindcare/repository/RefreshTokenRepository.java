package com.example.mindcare.repository;

import com.example.mindcare.entity.RefreshToken;
import com.example.mindcare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findAllByUser(User user);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update RefreshToken r set r.revoked = true, r.revokedAt = :now where r.user = :user and r.revoked = false")
    void revokeAllForUser(@Param("user") User user, @Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from RefreshToken r where r.expiryDate < :cutoff or (r.revoked = true and r.revokedAt < :cutoff)")
    void purgeExpiredTokens(@Param("cutoff") LocalDateTime cutoff);
}
