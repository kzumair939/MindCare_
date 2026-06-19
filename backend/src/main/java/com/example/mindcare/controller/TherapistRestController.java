package com.example.mindcare.controller;

import com.example.mindcare.entity.Therapist;
import com.example.mindcare.repository.TherapistRepository;
import com.example.mindcare.service.TherapistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/therapist")
@RequiredArgsConstructor
public class TherapistRestController {
    private final TherapistService therapistService;
    private final TherapistRepository therapistRepository;

    @GetMapping("/all")
    public ResponseEntity<?> all() {
        return ResponseEntity.ok(therapistService.getAllActiveTherapists().stream().map(this::toMap).collect(Collectors.toList()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        Therapist t = therapistRepository.findByUserAccount_Username(auth.getName())
            .orElseGet(() -> therapistRepository.findByUserAccount_Email(auth.getName()).orElseThrow());
        return ResponseEntity.ok(toMap(t));
    }

    @PostMapping("/admin/create")
    public ResponseEntity<?> create(@RequestBody Therapist t) {
        return ResponseEntity.ok(toMap(therapistService.createTherapist(t)));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Therapist t) {
        return ResponseEntity.ok(toMap(therapistService.updateTherapist(id, t)));
    }

    @PostMapping("/admin/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id) {
        therapistService.activateTherapist(id); return ResponseEntity.ok(Map.of("message","Activated"));
    }

    @PostMapping("/admin/{id}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long id) {
        therapistService.deactivateTherapist(id); return ResponseEntity.ok(Map.of("message","Deactivated"));
    }

    @PostMapping("/admin/{id}/picture")
    public ResponseEntity<?> uploadPicture(@PathVariable Long id, @RequestParam MultipartFile profilePicture) {
        therapistService.uploadProfilePicture(id, profilePicture);
        return ResponseEntity.ok(Map.of("message","Picture uploaded"));
    }

    private Map<String,Object> toMap(Therapist t) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id", t.getId()); m.put("name", t.getName()); m.put("email", t.getEmail());
        m.put("specialization", t.getSpecialization()); m.put("specialties", t.getSpecialties());
        m.put("languages", t.getLanguages()); m.put("sessionPrice", t.getSessionPrice());
        m.put("availableDays", t.getAvailableDays());
        m.put("availableTimeStart", t.getAvailableTimeStart()); m.put("availableTimeEnd", t.getAvailableTimeEnd());
        m.put("active", t.isActive()); m.put("verified", t.isVerified());
        m.put("profilePicturePath", t.getProfilePicturePath());
        return m;
    }
}
