package com.example.mindcare.repository;

import com.example.mindcare.entity.SessionReport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SessionReportRepository extends JpaRepository<SessionReport, Long> {
    @EntityGraph(attributePaths = {"session", "user", "therapist"})
    Optional<SessionReport> findBySession_Id(Long sessionId);
    List<SessionReport> findAllByUser_IdOrderByCreatedAtDesc(Long userId);
}
