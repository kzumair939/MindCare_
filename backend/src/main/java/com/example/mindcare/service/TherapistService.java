package com.example.mindcare.service;

import com.example.mindcare.entity.Therapist;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface TherapistService {

    List<Therapist> getAllTherapists();

    List<Therapist> findAvailableTherapists(LocalDate date, LocalTime time);

    List<Therapist> getAllActiveTherapists();

    Therapist createTherapist(Therapist therapist);

    Therapist updateTherapist(Long id, Therapist therapist);

    void deactivateTherapist(Long id);

    void activateTherapist(Long id);

    Therapist getTherapistById(Long id);

    void createTherapistAccount(Long therapistId, String username, String password);

    void verifyTherapist(Long therapistId, boolean verified);
    void uploadQualification(String therapistUsername, MultipartFile file);

    // NEW: profile picture upload
    void uploadProfilePicture(Long therapistId, MultipartFile file);
}
