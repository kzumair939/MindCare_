package com.example.mindcare.mapper;

import com.example.mindcare.Enum.Role;
import com.example.mindcare.dto.SignupRequestDto;
import com.example.mindcare.entity.User;

public class UserMapper {

    public static User toEntity(SignupRequestDto dto) {
        Role role = Role.ROLE_USER;
        if (dto.getRole() != null) {
            String r = dto.getRole().toUpperCase().trim();
            if (r.contains("ADMIN")) {
                role = Role.ROLE_ADMIN;
            } else if (r.contains("THERAPIST")) {
                role = Role.ROLE_THERAPIST;
            } else {
                role = Role.ROLE_USER;
            }
        }

        return User.builder()
                .username(dto.getUsername())
                .password(dto.getPassword())
                .email(dto.getEmail())
                .role(role)
                .displayName(dto.getUsername())
                .freeSessionsUsed(0)
                .anonymousMode(false)
                .deleted(false)
                .build();
    }
}

