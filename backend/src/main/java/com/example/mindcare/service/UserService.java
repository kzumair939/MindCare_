package com.example.mindcare.service;

import com.example.mindcare.dto.SignupRequestDto;
import com.example.mindcare.dto.UserProfileDto;
import com.example.mindcare.entity.User;

import java.util.Optional;

public interface UserService {
    void registerUser(SignupRequestDto dto);
    void processOAuthPostLogin(String email, String name);
    boolean checkEmailExists(String email);
    Optional<User> findByIdentifier(String identifier);
    void updateProfile(String identifier, UserProfileDto dto);
    void toggleAnonymousMode(String identifier);
    void deleteAccount(String identifier);
    int getFreeSessionsUsed(String identifier);
    boolean hasFreeSessionsLeft(String identifier);
    void verifyRegistrationOtp(String email, String otp);
    void resendVerificationOtp(String email);
}
