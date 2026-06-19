package com.example.mindcare.repository;

import com.example.mindcare.entity.SessionReportRevision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SessionReportRevisionRepository extends JpaRepository<SessionReportRevision, Long> {

    List<SessionReportRevision> findAllByReport_IdOrderBySavedAtDesc(Long reportId);
}
