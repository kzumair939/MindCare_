package com.example.mindcare.service.impl;

import com.example.mindcare.Enum.Role;
import com.example.mindcare.dto.SignupRequestDto;
import com.example.mindcare.dto.UserProfileDto;
import com.example.mindcare.entity.User;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.mapper.UserMapper;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.service.UserService;
import com.example.mindcare.service.EmailOtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailOtpService emailOtpService;

    @Override
    public void registerUser(SignupRequestDto dto) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("This email is already registered");
        }
        userRepository.findByUsername(dto.getUsername()).ifPresent(user -> {
            throw new BadRequestException("This username is already taken");
        });
        User user = UserMapper.toEntity(dto);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setDisplayName(dto.getUsername()); // default display name = username
        user.setAnonymousAlias("Anonymous_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        user.setEnabled(false); // require OTP verification
        userRepository.save(user);
        emailOtpService.sendOtp(user.getEmail());
    }

    @Override
    public void processOAuthPostLogin(String email, String name) {
        Optional<User> existUser = userRepository.findByEmail(email);
        if (existUser.isEmpty()) {
            String base = email.split("@")[0];
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(base);
            newUser.setDisplayName(name != null ? name : base);
            newUser.setRole(Role.ROLE_USER);
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setAnonymousAlias("Anonymous_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
            userRepository.save(newUser);
        }
    }

    @Override
    public boolean checkEmailExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    @Override
    public Optional<User> findByIdentifier(String identifier) {
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier));
    }

    @Override
    public void updateProfile(String identifier, UserProfileDto dto) {
        User user = findByIdentifier(identifier)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (dto.getDisplayName() != null && !dto.getDisplayName().isBlank()) {
            user.setDisplayName(dto.getDisplayName());
        }
        if (dto.getAge() != null) {
            user.setAge(dto.getAge());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getBio() != null) {
            user.setBio(dto.getBio());
        }
        userRepository.save(user);
    }

    @Override
    public void toggleAnonymousMode(String identifier) {
        User user = findByIdentifier(identifier)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setAnonymousMode(!user.isAnonymousMode());
        userRepository.save(user);
    }

    @Override
    public void deleteAccount(String identifier) {
        User user = findByIdentifier(identifier)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setDeleted(true);
        user.setEmail("deleted_" + user.getId() + "@deleted.com");
        userRepository.save(user);
    }

    @Override
    public int getFreeSessionsUsed(String identifier) {
        User user = findByIdentifier(identifier).orElse(null);
        return user != null ? user.getFreeSessionsUsed() : 0;
    }

    @Override
    public boolean hasFreeSessionsLeft(String identifier) {
        return getFreeSessionsUsed(identifier) < 2;
    }

    @Override
    @Transactional
    public void verifyRegistrationOtp(String email, String otp) {
        boolean valid = emailOtpService.verifyOtp(email, otp);
        if (!valid) {
            throw new BadRequestException("Invalid or expired verification code.");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        user.setEnabled(true);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void resendVerificationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (user.isEnabled()) {
            throw new BadRequestException("This account is already verified.");
        }
        emailOtpService.sendOtp(email);
    }
}
