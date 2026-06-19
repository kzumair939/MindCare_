package com.example.mindcare.config;

import com.example.mindcare.repository.UserRepository;
import com.example.mindcare.security.JwtAuthFilter;
import com.example.mindcare.service.impl.CustomUserDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailService userDetailService;
    private final UserRepository userRepository;
    private final JwtAuthFilter jwtAuthFilter;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(userDetailService);
        p.setPasswordEncoder(passwordEncoder());
        return p;
    }

    @Bean
    public GrantedAuthoritiesMapper userAuthoritiesMapper() {
        return (authorities) -> {
            Set<GrantedAuthority> mapped = new HashSet<>();
            authorities.forEach(a -> {
                if (a instanceof OAuth2UserAuthority oa) {
                    Map<String, Object> attrs = oa.getAttributes();
                    String email = (String) attrs.get("email");
                    userRepository.findByEmail(email).ifPresentOrElse(
                            u -> mapped.add(new SimpleGrantedAuthority(u.getRole().name())),
                            () -> mapped.add(new SimpleGrantedAuthority("ROLE_USER"))
                    );
                } else {
                    mapped.add(a);
                }
            });
            return mapped;
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(c -> c.disable())
            .cors(c -> {})
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authenticationProvider(daoAuthenticationProvider())
            .authorizeHttpRequests(auth -> auth
                // Public
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/login/**", "/oauth2/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Any authenticated user can read therapist list (for booking)
                .requestMatchers(HttpMethod.GET, "/api/therapist/all").authenticated()

                // Admin-only therapist management
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/therapist/admin/**").hasAnyAuthority("ROLE_ADMIN")

                // Therapist portal
                .requestMatchers("/api/therapist/**").hasAnyAuthority("ROLE_THERAPIST","ROLE_ADMIN")

                // Group & session — all authenticated users
                .requestMatchers("/api/group/**").authenticated()
                .requestMatchers("/api/session/**").authenticated()
                .requestMatchers("/api/user/**").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo ->
                    userInfo.userAuthoritiesMapper(userAuthoritiesMapper())
                )
                .successHandler(oAuth2LoginSuccessHandler)
            );

        return http.build();
    }
}
