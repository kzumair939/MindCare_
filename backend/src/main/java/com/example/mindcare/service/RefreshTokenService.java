package com.example.mindcare.service;

import com.example.mindcare.entity.RefreshToken;

import java.util.Map;

public interface RefreshTokenService {

    RefreshToken createRefreshToken(String userIdentifier);

    Map<String, String> rotateRefreshToken(String rawRefreshToken);

    void revokeToken(String rawRefreshToken);

    void revokeAllForUser(String userIdentifier);
}
