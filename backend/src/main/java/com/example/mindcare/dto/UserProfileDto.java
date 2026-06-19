package com.example.mindcare.dto;

import lombok.Data;

@Data
public class UserProfileDto {
    private String displayName;
    private Integer age;
    private String phone;
    private String bio;
}
