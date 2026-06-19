package com.example.mindcare.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordDto {

    @NotBlank
    private String token;

    @NotBlank
    private String newPassword;

}