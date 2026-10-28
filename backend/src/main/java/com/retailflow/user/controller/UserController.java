package com.retailflow.user.controller;

import com.retailflow.auth.dto.UserDto;
import com.retailflow.common.response.ApiResponse;
import com.retailflow.security.UserPrincipal;
import com.retailflow.user.dto.CreateUserRequest;
import com.retailflow.user.dto.UpdateUserRequest;
import com.retailflow.user.entity.User;
import com.retailflow.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management and administrative endpoints")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Get paginated users for current organization")
    public ResponseEntity<ApiResponse<Page<UserDto>>> getUsers(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) User.Role role,
            @PageableDefault(size = 20) Pageable pageable) {
        if (role != null) {
            List<UserDto> users = userService.getUsersByRole(principal.getOrganizationId(), role);
            return ResponseEntity.ok(ApiResponse.success(Page.empty())); // or return list
        }
        Page<UserDto> page = userService.getUsers(principal.getOrganizationId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/role/{role}")
    @Operation(summary = "Get users filtered by role")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsersByRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable User.Role role) {
        List<UserDto> users = userService.getUsersByRole(principal.getOrganizationId(), role);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        UserDto user = userService.getUserById(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping
    @Operation(summary = "Create a new user within organization")
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateUserRequest request) {
        UserDto created = userService.createUser(principal.getOrganizationId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "User created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user details")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserDto updated = userService.updateUser(principal.getOrganizationId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "User updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle user active/inactive status")
    public ResponseEntity<ApiResponse<UserDto>> toggleStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam User.UserStatus status) {
        UserDto updated = userService.toggleUserStatus(principal.getOrganizationId(), id, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated"));
    }
}
