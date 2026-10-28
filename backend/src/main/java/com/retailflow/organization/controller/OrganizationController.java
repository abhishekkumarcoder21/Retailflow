package com.retailflow.organization.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.organization.dto.OrganizationDto;
import com.retailflow.organization.dto.UpdateOrganizationRequest;
import com.retailflow.organization.service.OrganizationService;
import com.retailflow.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/organizations")
@Tag(name = "Organizations", description = "Endpoints for managing organization profile and tenant settings")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/current")
    @Operation(summary = "Get current organization profile")
    public ResponseEntity<ApiResponse<OrganizationDto>> getCurrentOrganization(
            @AuthenticationPrincipal UserPrincipal principal) {
        OrganizationDto org = organizationService.getCurrentOrganization(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(org));
    }

    @PutMapping("/current")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update current organization profile (Admin only)")
    public ResponseEntity<ApiResponse<OrganizationDto>> updateCurrentOrganization(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateOrganizationRequest request) {
        OrganizationDto updated = organizationService.updateCurrentOrganization(principal.getOrganizationId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Organization updated successfully"));
    }
}
