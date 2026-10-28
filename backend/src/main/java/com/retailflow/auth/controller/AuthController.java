package com.retailflow.auth.controller;

import com.retailflow.auth.dto.LoginRequest;
import com.retailflow.auth.dto.LoginResponse;
import com.retailflow.auth.dto.RegisterRequest;
import com.retailflow.auth.dto.UserDto;
import com.retailflow.auth.service.AuthService;
import com.retailflow.common.response.ApiResponse;
import com.retailflow.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user authentication and session management")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and set JWT cookie")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.success(loginResponse, "Login successful"));
    }

    @PostMapping("/register")
    @Operation(summary = "Register organization and initial admin account")
    public ResponseEntity<ApiResponse<LoginResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        LoginResponse loginResponse = authService.register(request, response);
        return ResponseEntity.ok(ApiResponse.success(loginResponse, "Registration successful"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {
        UserDto user = authService.getCurrentUser(principal);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/logout")
    @Operation(summary = "Clear authentication cookie and invalidate session")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
}
