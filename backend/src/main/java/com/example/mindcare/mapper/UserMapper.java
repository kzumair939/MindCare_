package com.example.mindcare.mapper;

import com.example.mindcare.Enum.Role;
import com.example.mindcare.dto.SignupRequestDto;
import com.example.mindcare.entity.User;

public class UserMapper {

    public static User toEntity(SignupRequestDto dto) {
        // Enforce least privilege: public self-registration always assigns ROLE_USER.
        // Administrative and Therapist accounts cannot be self-assigned via registration DTO.
        Role role = Role.ROLE_USER;

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

