package com.example.mindcare.service;

public interface PasswordResetService {

    void createPasswordResetToken(String email);

    void resetPassword(String token, String newPassword);

    void resetPasswordWithOtp(String email, String otp, String newPassword);

    boolean verifyResetOtp(String email, String otp);

    void sendResetLink(String email);
}
