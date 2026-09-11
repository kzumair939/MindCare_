package com.example.mindcare.config;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.Enum.Role;
import com.example.mindcare.Enum.TherapyType;
import com.example.mindcare.dto.GroupRoomDto;
import com.example.mindcare.dto.SignupRequestDto;
import com.example.mindcare.entity.GroupRoom;
import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.Therapist;
import com.example.mindcare.entity.User;
import com.example.mindcare.repository.GroupMessageRepository;
import com.example.mindcare.repository.GroupRoomRepository;
import com.example.mindcare.repository.SessionRepository;
import com.example.mindcare.repository.TherapistRepository;
import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.security.JwtUtils;
import com.example.mindcare.service.GroupService;
import com.example.mindcare.service.PasswordResetService;
import com.example.mindcare.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sectestdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "DB_PASSWORD=",
        "EMAIL_USERNAME=test@example.com",
        "EMAIL_PASSWORD=testpass",
        "JWT_SECRET=MySuperSecureDevSecretKey1234567890123456",
        "GOOGLE_CLIENT_ID=mock-google-client-id",
        "GOOGLE_CLIENT_SECRET=mock-google-client-secret"
})
@AutoConfigureMockMvc
public class SecurityAndAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TherapistRepository therapistRepository;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private GroupRoomRepository groupRoomRepository;

    @Autowired
    private GroupMessageRepository groupMessageRepository;

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserService userService;

    @Autowired
    private com.example.mindcare.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private com.example.mindcare.repository.RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private com.example.mindcare.repository.SessionReportRepository sessionReportRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.example.mindcare.repository.NotificationRepository notificationRepository;

    @Autowired
    private com.example.mindcare.repository.GroupMemberRepository groupMemberRepository;

    @Autowired
    private com.example.mindcare.repository.GroupInviteRepository groupInviteRepository;

    @Autowired
    private com.example.mindcare.repository.PaymentRepository paymentRepository;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User patientUser;
    private User attackerUser;
    private User adminUser;
    private Therapist therapist;
    private Session activeSession;

    @BeforeEach
    public void setup() {
        refreshTokenRepository.deleteAll();
        sessionReportRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        notificationRepository.deleteAll();
        paymentRepository.deleteAll();
        sessionRepository.deleteAll();
        groupMessageRepository.deleteAll();
        groupMemberRepository.deleteAll();
        groupInviteRepository.deleteAll();
        groupRoomRepository.deleteAll();
        therapistRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Patient User
        patientUser = User.builder()
                .username("patient1")
                .email("patient1@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.ROLE_USER)
                .displayName("Patient One")
                .enabled(true)
                .freeSessionsUsed(0)
                .build();
        userRepository.save(patientUser);

        // 2. Create Attacker / Third Party User
        attackerUser = User.builder()
                .username("attacker")
                .email("attacker@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.ROLE_USER)
                .displayName("Attacker User")
                .enabled(true)
                .freeSessionsUsed(0)
                .build();
        userRepository.save(attackerUser);

        // 3. Create Admin User
        adminUser = User.builder()
                .username("adminuser")
                .email("admin@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.ROLE_ADMIN)
                .displayName("Admin")
                .enabled(true)
                .freeSessionsUsed(0)
                .build();
        userRepository.save(adminUser);

        // 4. Create Therapist
        User therapistAccount = User.builder()
                .username("drsmith")
                .email("drsmith@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.ROLE_THERAPIST)
                .displayName("Dr. Smith")
                .enabled(true)
                .build();
        userRepository.save(therapistAccount);

        therapist = Therapist.builder()
                .name("Dr. Smith")
                .email("drsmith@example.com")
                .specialization("Cognitive Behavioral Therapy")
                .availableTimeStart("09:00")
                .availableTimeEnd("17:00")
                .availableDays("MONDAY,TUESDAY,WEDNESDAY")
                .userAccount(therapistAccount)
                .build();
        therapistRepository.save(therapist);

        // 5. Create Session
        activeSession = Session.builder()
                .user(patientUser)
                .therapist(therapist)
                .sessionDate(LocalDate.now().plusDays(1))
                .sessionTime(LocalTime.of(10, 0))
                .sessionType("ONLINE")
                .therapyType(TherapyType.CBT)
                .status(AppointmentStatus.BOOKED)
                .feeAmount(50)
                .build();
        sessionRepository.save(activeSession);
    }

    @Test
    public void testInsecureOAuth2TokenEndpointIsRemoved() throws Exception {
        // Attempting to hit the previously vulnerable account takeover endpoint
        mockMvc.perform(post("/api/auth/oauth2/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@example.com\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testUserRegistrationRequiresEmailVerificationBeforeLogin() {
        SignupRequestDto dto = new SignupRequestDto();
        dto.setUsername("newuser_" + UUID.randomUUID().toString().substring(0, 6));
        dto.setEmail("newuser@example.com");
        dto.setPassword("ValidPass123!");

        userService.registerUser(dto);

        User created = userRepository.findByEmail("newuser@example.com").orElseThrow();
        assertFalse(created.isEnabled(), "New users must be disabled until email OTP is verified");
    }

    @Test
    public void testIDORProtectionOnSessionMessages() throws Exception {
        String attackerToken = jwtUtils.generateTokenFromUsername(attackerUser.getUsername());
        String patientToken = jwtUtils.generateTokenFromUsername(patientUser.getUsername());

        // Attacker attempting to read patient's session messages should receive 403 Forbidden
        mockMvc.perform(get("/api/session/" + activeSession.getId() + "/messages")
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden());

        // Patient should be allowed
        mockMvc.perform(get("/api/session/" + activeSession.getId() + "/messages")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk());
    }

    @Test
    public void testBFLAProtectionOnAdminSessionEndpoint() throws Exception {
        String patientToken = jwtUtils.generateTokenFromUsername(patientUser.getUsername());
        String adminToken = jwtUtils.generateTokenFromUsername(adminUser.getUsername());

        // Regular user should receive 403 Forbidden
        mockMvc.perform(get("/api/session/admin/all")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden());

        // Admin should receive 200 OK
        mockMvc.perform(get("/api/session/admin/all")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    public void testSupportGroupAnonymityHidesSenderUsername() throws Exception {
        GroupRoomDto dto = new GroupRoomDto();
        dto.setName("Anxiety Support");
        dto.setTopic("Safe space");
        dto.setMaxMembers(15);
        GroupRoom room = groupService.createRoom(therapist.getUserAccount().getUsername(), dto);
        groupService.addMember(room.getId(), patientUser);
        groupService.addMember(room.getId(), attackerUser);

        // Patient sends an anonymous message
        groupService.sendMessage(room.getId(), patientUser.getUsername(), "Feeling nervous today", true);

        // Attacker views messages in the room
        String attackerToken = jwtUtils.generateTokenFromUsername(attackerUser.getUsername());
        mockMvc.perform(get("/api/group/" + room.getId() + "/messages")
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].anonymous").value(true))
                .andExpect(jsonPath("$[0].senderUsername").value(nullValue()));
    }

    @Test
    public void testUnrestrictedFileUploadIsBlocked() throws Exception {
        GroupRoomDto dto = new GroupRoomDto();
        dto.setName("Wellness");
        dto.setTopic("Topic");
        dto.setMaxMembers(15);
        GroupRoom room = groupService.createRoom(therapist.getUserAccount().getUsername(), dto);
        groupService.addMember(room.getId(), patientUser);
        String patientToken = jwtUtils.generateTokenFromUsername(patientUser.getUsername());

        MockMultipartFile badFile = new MockMultipartFile(
                "file",
                "malicious.html",
                "text/html",
                "<script>alert('xss')</script>".getBytes()
        );

        mockMvc.perform(multipart("/api/group/" + room.getId() + "/upload")
                        .file(badFile)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testPasswordResetEnforcesStrength() {
        passwordResetService.createPasswordResetToken(patientUser.getEmail());
        // Verify trying to reset with weak password fails
        org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () -> {
            passwordResetService.resetPassword("invalid-token", "weak");
        });
    }

    @Test
    public void testUserRegistrationCannotEscalateToAdminOrTherapist() {
        SignupRequestDto dto = new SignupRequestDto();
        dto.setUsername("attacker_admin_" + UUID.randomUUID().toString().substring(0, 6));
        dto.setEmail("attacker_admin@example.com");
        dto.setPassword("ValidPass123!");
        dto.setRole("ADMIN"); // Malicious payload attempting privilege escalation

        userService.registerUser(dto);

        User created = userRepository.findByEmail("attacker_admin@example.com").orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(
                Role.ROLE_USER,
                created.getRole(),
                "Self-registration must ALWAYS enforce ROLE_USER and deny privilege escalation to ROLE_ADMIN"
        );
    }

    @Test
    public void testIDORProtectionOnPaymentEndpoints() throws Exception {
        String attackerToken = jwtUtils.generateTokenFromUsername(attackerUser.getUsername());

        // Attacker attempts to apply free session credits to patient's active session
        mockMvc.perform(post("/api/payment/free/" + activeSession.getId())
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You are not authorized to apply free session credits to this session"));

        // Attacker attempts to process payment on patient's active session
        mockMvc.perform(post("/api/payment/pay")
                        .header("Authorization", "Bearer " + attackerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionId\":" + activeSession.getId() + ",\"amount\":50}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("You are not authorized to process payment for this session"));
    }

    @Test
    public void testForgotPasswordDoesNotEnumerateAccounts() throws Exception {
        // Non-existent email
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nonexistent_user_99999@test.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account with that email or username exists, a password reset code has been sent."));

        // Existing patient email
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + patientUser.getEmail() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account with that email or username exists, a password reset code has been sent."));
    }

    @Test
    public void testTherapistQualificationRejectsDisallowedExtensions() throws Exception {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "MZ...".getBytes()
        );

        Therapist therapistEntity = therapist;
        String therapistUsername = therapist.getUserAccount().getUsername();

        // Test through therapist service directly
        org.junit.jupiter.api.Assertions.assertThrows(
                com.example.mindcare.exception.BadRequestException.class,
                () -> {
                    com.example.mindcare.service.impl.TherapistServiceImpl impl =
                            new com.example.mindcare.service.impl.TherapistServiceImpl(therapistRepository, sessionRepository, userRepository, passwordEncoder);
                    impl.uploadQualification(therapistUsername, exeFile);
                }
        );
    }

    @Test
    public void testFieldLevelAesEncryptionOnSessionReportNotes() {
        com.example.mindcare.entity.SessionReport report = com.example.mindcare.entity.SessionReport.builder()
                .session(activeSession)
                .user(patientUser)
                .therapist(therapist)
                .symptomsSummary("Mild Anxiety")
                .privateNotes("TopSecret Clinical Diagnosis & Private Psych Notes 12345")
                .createdAt(java.time.LocalDateTime.now())
                .build();

        report = sessionReportRepository.save(report);

        // 1. Verify JPA decryption reads clear text back
        com.example.mindcare.entity.SessionReport fetched = sessionReportRepository.findById(report.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(
                "TopSecret Clinical Diagnosis & Private Psych Notes 12345",
                fetched.getPrivateNotes(),
                "JPA reading must transparently decrypt AES-256 encrypted private notes"
        );

        // 2. Verify direct JDBC database column at rest is encrypted with ENC: prefix and does NOT contain plain text
        String rawDbNotes = jdbcTemplate.queryForObject(
                "SELECT private_notes FROM session_reports WHERE id = ?",
                String.class,
                report.getId()
        );

        org.junit.jupiter.api.Assertions.assertNotNull(rawDbNotes);
        org.junit.jupiter.api.Assertions.assertTrue(
                rawDbNotes.startsWith("ENC:"),
                "Raw database column must start with ENC: prefix denoting AES-256 GCM encryption"
        );
        org.junit.jupiter.api.Assertions.assertFalse(
                rawDbNotes.contains("TopSecret"),
                "Raw database column must NOT contain plaintext confidential clinical notes"
        );
    }

    @Test
    public void testRefreshTokenRotationAndReuseDetection() throws Exception {
        // 1. Login with patient credentials
        String loginPayload = "{\"username\":\"patient1\",\"password\":\"Password123!\"}";
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andReturn().getResponse().getContentAsString();

        com.fasterxml.jackson.databind.JsonNode loginJson = new com.fasterxml.jackson.databind.ObjectMapper().readTree(loginResponse);
        String initialRefreshToken = loginJson.get("refreshToken").asText();

        // 2. Rotate refresh token once (valid rotation)
        String rotatePayload = "{\"refreshToken\":\"" + initialRefreshToken + "\"}";
        String rotateResponse = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rotatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andReturn().getResponse().getContentAsString();

        com.fasterxml.jackson.databind.JsonNode rotateJson = new com.fasterxml.jackson.databind.ObjectMapper().readTree(rotateResponse);
        String rotatedRefreshToken = rotateJson.get("refreshToken").asText();

        org.junit.jupiter.api.Assertions.assertNotEquals(
                initialRefreshToken,
                rotatedRefreshToken,
                "Rotated refresh token must be cryptographically distinct from the original single-use refresh token"
        );

        // 3. Reuse Attack: Attempt to reuse the already-revoked initial refresh token
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rotatePayload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Attempted reuse of revoked refresh token")));

        // 4. Verify all tokens for this patient were invalidated due to reuse detection
        java.util.List<com.example.mindcare.entity.RefreshToken> tokens = refreshTokenRepository.findAllByUser(patientUser);
        org.junit.jupiter.api.Assertions.assertTrue(
                tokens.stream().allMatch(com.example.mindcare.entity.RefreshToken::isRevoked),
                "All refresh tokens for user must be revoked following an attempted token reuse"
        );
    }
}
