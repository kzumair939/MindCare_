package com.example.mindcare.config;

import com.example.mindcare.dto.SignupRequestDto;
import com.example.mindcare.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "DB_PASSWORD=",
        "EMAIL_USERNAME=test@example.com",
        "EMAIL_PASSWORD=testpass",
        "server.forward-headers-strategy=framework",
        "JWT_SECRET=MySuperSecureDevSecretKey1234567890123456",
        "GOOGLE_CLIENT_ID=mock-google-client-id",
        "GOOGLE_CLIENT_SECRET=mock-google-client-secret"
})
@AutoConfigureMockMvc
public class OAuth2RedirectIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testOAuth2AuthorizationRedirectWithForwardedHeaders() throws Exception {
        // When we pass standard forwarded headers pointing to localhost:8080
        mockMvc.perform(get("/oauth2/authorization/google")
                        .header("X-Forwarded-Host", "localhost")
                        .header("X-Forwarded-Port", "8080")
                        .header("X-Forwarded-Proto", "http"))
                .andExpect(status().is3xxRedirection())
                // Verify the redirect_uri parameter generated is correct and contains port 8080
                .andExpect(header().string("Location", containsString("redirect_uri=http://localhost:8080/login/oauth2/code/google")));
    }

    @Test
    public void testOAuth2AuthorizationRedirectWithProductionHeaders() throws Exception {
        // When we pass production headers (https on port 443)
        mockMvc.perform(get("/oauth2/authorization/google")
                        .header("X-Forwarded-Host", "mindcare-app.com")
                        .header("X-Forwarded-Port", "443")
                        .header("X-Forwarded-Proto", "https"))
                .andExpect(status().is3xxRedirection())
                // Verify the redirect_uri parameter generated contains https and no non-standard port
                .andExpect(header().string("Location", containsString("redirect_uri=https://mindcare-app.com/login/oauth2/code/google")));
    }

    @Autowired
    private OAuth2LoginSuccessHandler successHandler;

    @Test
    public void testOAuth2LoginSuccessHandlerRedirectsToFrontend() throws Exception {
        // Create Mock request, response, and auth objects
        org.springframework.mock.web.MockHttpServletRequest request = new org.springframework.mock.web.MockHttpServletRequest();
        org.springframework.mock.web.MockHttpServletResponse response = new org.springframework.mock.web.MockHttpServletResponse();
        
        org.springframework.security.core.Authentication authentication = org.mockito.Mockito.mock(org.springframework.security.core.Authentication.class);
        org.springframework.security.oauth2.core.user.OAuth2User oauthUser = org.mockito.Mockito.mock(org.springframework.security.oauth2.core.user.OAuth2User.class);
        
        org.mockito.Mockito.when(authentication.getPrincipal()).thenReturn(oauthUser);
        org.mockito.Mockito.when(oauthUser.getAttribute("email")).thenReturn("googleuser@example.com");
        org.mockito.Mockito.when(oauthUser.getAttribute("name")).thenReturn("Google User");

        // Execute Success Handler
        successHandler.onAuthenticationSuccess(request, response, authentication);

        // Verify redirect URL contains the JWT token parameter
        String redirectedUrl = response.getRedirectedUrl();
        org.junit.jupiter.api.Assertions.assertNotNull(redirectedUrl);
        org.junit.jupiter.api.Assertions.assertTrue(redirectedUrl.contains("/oauth2/callback?token="));
    }

    @Autowired
    private com.example.mindcare.repository.UserRepository userRepository;

    @Autowired
    private com.example.mindcare.repository.EmailOtpRepository emailOtpRepository;

    @Test
    public void testManualSignupRequiresOtpAndCannotLoginUntilVerified() throws Exception {
        // 1. Signup
        SignupRequestDto signupDto = new SignupRequestDto();
        signupDto.setUsername("manualuser");
        signupDto.setEmail("manualuser@example.com");
        signupDto.setPassword("Password123!");
        
        mockMvc.perform(post("/api/auth/register")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(signupDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Verification OTP code sent")));

        // Verify user is created but disabled
        User user = userRepository.findByEmail("manualuser@example.com").orElseThrow();
        org.junit.jupiter.api.Assertions.assertFalse(user.isEnabled());

        // 2. Attempt login -> should fail with disabled account error
        Map<String, String> loginReq = Map.of("username", "manualuser@example.com", "password", "Password123!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error", containsString("Your account is not verified")));

        // 3. Find the generated OTP in repository
        com.example.mindcare.entity.EmailOtp emailOtp = emailOtpRepository.findTopByEmailOrderByCreatedAtDesc("manualuser@example.com").orElseThrow();
        String otp = emailOtp.getOtp();

        // 4. Verify OTP
        Map<String, String> verifyReq = Map.of("email", "manualuser@example.com", "otp", otp);
        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("manualuser"));

        // Verify user is now enabled
        user = userRepository.findByEmail("manualuser@example.com").orElseThrow();
        org.junit.jupiter.api.Assertions.assertTrue(user.isEnabled());
    }
}
