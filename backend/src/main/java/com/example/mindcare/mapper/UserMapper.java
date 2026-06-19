package com.example.mindcare.mapper;

import com.example.mindcare.Enum.Role;
import com.example.mindcare.dto.SignupRequestDto;
import com.example.mindcare.entity.User;

public class UserMapper {

    public static User toEntity(SignupRequestDto dto) {
        return User.builder()
                .username(dto.getUsername())
                .password(dto.getPassword())
                .email(dto.getEmail())
                .role(Role.ROLE_USER)
                .displayName(dto.getUsername())
                .freeSessionsUsed(0)
                .anonymousMode(false)
                .deleted(false)
                .build();
    }
}
