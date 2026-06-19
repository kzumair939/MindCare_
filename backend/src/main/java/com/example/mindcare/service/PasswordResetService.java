package com.example.mindcare.service;

public interface PasswordResetService {

    void createPasswordResetToken(String email);

    void resetPassword(String token, String newPassword);

    void sendResetLink(String email);
}
