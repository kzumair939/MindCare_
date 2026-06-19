package com.example.mindcare.service;

public interface EmailOtpService {
    void sendOtp(String email);
    boolean verifyOtp(String email, String otp);
}
