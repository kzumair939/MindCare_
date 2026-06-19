package com.example.mindcare.repository;

import com.example.mindcare.entity.Therapist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TherapistRepository extends JpaRepository<Therapist,Long> {



    List<Therapist> findByActiveTrueOrderBySeniorDescNameAsc();

    Optional<Therapist> findByUserAccount_Username(String username);
    Optional<Therapist> findByUserAccount_Email(String email);
}
