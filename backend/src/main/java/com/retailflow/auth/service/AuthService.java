package com.retailflow.auth.service;

import com.retailflow.auth.dto.LoginRequest;
import com.retailflow.auth.dto.LoginResponse;
import com.retailflow.auth.dto.RegisterRequest;
import com.retailflow.auth.dto.UserDto;
import com.retailflow.common.exception.BadRequestException;
import com.retailflow.common.exception.ConflictException;
import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.security.JwtService;
import com.retailflow.security.UserPrincipal;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(principal);
        setAuthCookie(response, token, (int) (jwtExpirationMs / 1000));

        Organization org = user.getOrganization();
        return LoginResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .organizationId(org.getId())
                .organizationName(org.getName())
                .organizationSlug(org.getSlug())
                .build();
    }

    @Transactional
    public LoginResponse register(RegisterRequest request, HttpServletResponse response) {
        if (organizationRepository.existsBySlug(request.getOrganizationSlug())) {
            throw new ConflictException("Organization slug already exists: " + request.getOrganizationSlug());
        }

        Organization org = new Organization();
        org.setName(request.getOrganizationName());
        org.setSlug(request.getOrganizationSlug().toLowerCase().trim());
        org.setBusinessType(request.getBusinessType());
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        org = organizationRepository.save(org);

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ConflictException("Email already registered: " + request.getEmail());
        }

        User user = new User();
        user.setOrganization(org);
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(User.Role.ADMIN);
        user.setStatus(User.UserStatus.ACTIVE);
        user.setLastLoginAt(LocalDateTime.now());
        user = userRepository.save(user);

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        setAuthCookie(response, token, (int) (jwtExpirationMs / 1000));

        return LoginResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .organizationId(org.getId())
                .organizationName(org.getName())
                .organizationSlug(org.getSlug())
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UserPrincipal principal) {
        if (principal == null) {
            throw new BadRequestException("Not authenticated");
        }
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserDto.fromEntity(user);
    }

    public void logout(HttpServletResponse response) {
        setAuthCookie(response, "", 0);
    }

    private void setAuthCookie(HttpServletResponse response, String token, int maxAge) {
        Cookie cookie = new Cookie(jwtService.getCookieName(), token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(maxAge);
        cookie.setSecure(false); // set to true in production over HTTPS
        response.addCookie(cookie);
    }
}
