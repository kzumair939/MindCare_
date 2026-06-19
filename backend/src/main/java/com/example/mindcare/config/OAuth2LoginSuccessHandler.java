package com.example.mindcare.config;

import com.example.mindcare.Enum.Role;
import com.example.mindcare.entity.User;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name  = oauthUser.getAttribute("name");

        // 1. Find or create user
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setUsername(email.split("@")[0]);
                    newUser.setDisplayName(name);
                    newUser.setRole(Role.ROLE_USER);
                    newUser.setPassword("OAUTH_USER");
                    return userRepository.save(newUser);
                });

        // 2. Generate JWT
        String token = jwtUtils.generateTokenFromUsername(user.getUsername());

        // 3. Redirect to frontend callback
        response.sendRedirect(
                frontendUrl + "/oauth2/callback?token=" + token
        );
    }
}