package com.example.mindcare.repository;

import com.example.mindcare.entity.SurveyResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SurveyResultRepository extends JpaRepository<SurveyResult, Long> {
    Optional<SurveyResult> findByUser_Username(String username);
    Optional<SurveyResult> findByUser_Id(Long userId);
}
