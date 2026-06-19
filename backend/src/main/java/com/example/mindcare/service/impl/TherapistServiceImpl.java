package com.example.mindcare.service.impl;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.Enum.Role;
import com.example.mindcare.entity.Therapist;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.repository.TherapistRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.TherapistService;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Locale;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class TherapistServiceImpl implements TherapistService {

    private final TherapistRepository therapistRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<Therapist> getAllTherapists() {
        return therapistRepository.findAll();
    }

    private static LocalTime parseTimeSafely(String timeStr, LocalTime defaultTime) {
        if (timeStr == null || timeStr.trim().isEmpty()) {
            return defaultTime;
        }
        String clean = timeStr.trim();
        try {
            return LocalTime.parse(clean);
        } catch (Exception ignored) {}

        String[] formats = {
            "HH:mm", "H:mm", "HH:mm:ss", "H:mm:ss",
            "hh:mm a", "h:mm a", "hh:mm:ss a", "h:mm:ss a",
            "hh:mma", "h:mma", "hh:mm:ssa", "h:mm:ssa"
        };
        for (String format : formats) {
            try {
                DateTimeFormatter formatter = new DateTimeFormatterBuilder()
                        .parseCaseInsensitive()
                        .appendPattern(format)
                        .toFormatter(Locale.ENGLISH);
                return LocalTime.parse(clean, formatter);
            } catch (Exception ignored) {}
        }
        return defaultTime;
    }

    @Override
    public List<Therapist> findAvailableTherapists(LocalDate date, LocalTime time) {
        List<Therapist> allTherapists = therapistRepository.findAll();
        List<Therapist> availableTherapist = new ArrayList<>();
        String requestedDay = date.getDayOfWeek().name(); // e.g. "MONDAY"

        for (Therapist therapist : allTherapists) {
            if (!therapist.isActive()) {
                continue;
            }

            // 1. Verify requested day matches therapist's working days
            String availableDays = therapist.getAvailableDays();
            if (availableDays == null || availableDays.trim().isEmpty()) {
                continue;
            }
            List<String> days = Arrays.stream(availableDays.split(","))
                    .map(d -> d.trim().toUpperCase())
                    .toList();
            if (!days.contains(requestedDay)) {
                continue;
            }

            // 2. Verify requested time matches therapist's working hours
            String startStr = therapist.getAvailableTimeStart();
            String endStr = therapist.getAvailableTimeEnd();
            LocalTime start = parseTimeSafely(startStr, LocalTime.of(9, 0));
            LocalTime end = parseTimeSafely(endStr, LocalTime.of(17, 0));

            if (end.equals(LocalTime.MIDNIGHT)) {
                end = LocalTime.MAX;
            }
            if (end.isBefore(start) && end.getHour() < 12) {
                end = end.plusHours(12);
            }

            if (time.isBefore(start) || time.isAfter(end)) {
                continue;
            }

            // 3. Verify therapist is not already booked
            boolean isBooked = sessionRepository
                    .existsByTherapistAndSessionDateAndSessionTimeAndStatus(therapist, date, time, AppointmentStatus.BOOKED);

            if (!isBooked) {
                availableTherapist.add(therapist);
            }
        }

        return availableTherapist;
    }

    @Override
    public List<Therapist> getAllActiveTherapists() {
        return therapistRepository.findByActiveTrueOrderBySeniorDescNameAsc();
    }

    // =========================
    // Admin CRUD
    // =========================

    @Override
    public Therapist createTherapist(Therapist therapist) {
        therapist.setId(null);
        // default active true unless admin unchecked
        return therapistRepository.save(therapist);
    }

    @Override
    public Therapist updateTherapist(Long id, Therapist updated) {
        Therapist existing = therapistRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));

        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setSpecialization(updated.getSpecialization());
        existing.setSpecialties(updated.getSpecialties());
        existing.setLanguages(updated.getLanguages());
        existing.setSessionPrice(updated.getSessionPrice());
        if (updated.getAvailableDays() != null) existing.setAvailableDays(updated.getAvailableDays());
        if (updated.getAvailableTimeStart() != null) existing.setAvailableTimeStart(updated.getAvailableTimeStart());
        if (updated.getAvailableTimeEnd() != null) existing.setAvailableTimeEnd(updated.getAvailableTimeEnd());
        existing.setActive(updated.isActive());
        existing.setSenior(updated.isSenior());

        return therapistRepository.save(existing);
    }

    @Override
    public void verifyTherapist(Long therapistId, boolean verified) {
        Therapist t = therapistRepository.findById(therapistId)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));
        t.setVerified(verified);
        t.setVerifiedAt(verified ? LocalDateTime.now() : null);
        therapistRepository.save(t);
    }

    @Override
    public void uploadQualification(String therapistUsername, MultipartFile file) {
        Therapist therapist = therapistRepository.findByUserAccount_Username(therapistUsername)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose a file");
        }

        try {
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

            String original = file.getOriginalFilename() == null ? "qualifications" : file.getOriginalFilename();
            String safe = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String name = UUID.randomUUID() + "_" + safe;
            Path target = uploadDir.resolve(name);
            Files.write(target, file.getBytes());

            therapist.setQualificationFilePath(target.toString());
            therapist.setVerificationRequestedAt(LocalDateTime.now());
            therapistRepository.save(therapist);
        } catch (Exception ex) {
            throw new BadRequestException("Upload failed: " + ex.getMessage());
        }
    }

    @Override
    public void deactivateTherapist(Long id) {
        Therapist existing = therapistRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));
        existing.setActive(false);
        therapistRepository.save(existing);
    }

    @Override
    public void activateTherapist(Long id) {
        Therapist existing = therapistRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));
        existing.setActive(true);
        therapistRepository.save(existing);
    }

    @Override
    public Therapist getTherapistById(Long id) {
        return therapistRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));
    }

    // =========================
    // Admin-only: Therapist Account
    // =========================

    @Override
    public void createTherapistAccount(Long therapistId, String username, String password) {

        if (username == null || username.isBlank()) {
            throw new BadRequestException("Username is required for therapist account");
        }
        if (password == null || password.isBlank()) {
            throw new BadRequestException("Password is required for therapist account");
        }

        Therapist therapist = therapistRepository.findById(therapistId)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));

        if (therapist.getUserAccount() != null) {
            throw new BadRequestException("This therapist already has a login account");
        }

        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username already exists");
        }
        if (therapist.getEmail() != null && userRepository.existsByEmail(therapist.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = User.builder()
                .username(username)
                .email(therapist.getEmail())
                .password(passwordEncoder.encode(password))
                .role(Role.ROLE_THERAPIST)
                .build();

        User saved = userRepository.save(user);
        therapist.setUserAccount(saved);
        therapistRepository.save(therapist);
    }

    @Override
    public void uploadProfilePicture(Long therapistId, MultipartFile file) {
        Therapist therapist = therapistRepository.findById(therapistId)
                .orElseThrow(() -> new NotFoundException("Therapist not found"));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select a picture to upload");
        }

        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        try {
            Path uploadDir = Paths.get("uploads/profile-pictures");
            if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

            String original = file.getOriginalFilename() == null ? "pic" : file.getOriginalFilename();
            String safe = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            String name = UUID.randomUUID() + "_" + safe;
            Path target = uploadDir.resolve(name);
            Files.write(target, file.getBytes());

            // Remove old picture if present
            if (therapist.getProfilePicturePath() != null) {
                try { Files.deleteIfExists(Paths.get(therapist.getProfilePicturePath())); } catch (Exception ignored) {}
            }

            therapist.setProfilePicturePath(target.toString());
            therapistRepository.save(therapist);
        } catch (Exception ex) {
            throw new BadRequestException("Profile picture upload failed: " + ex.getMessage());
        }
    }
}

