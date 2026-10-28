package com.retailflow.retailer.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.retailer.dto.CreateRetailerRequest;
import com.retailflow.retailer.dto.RetailerDto;
import com.retailflow.retailer.entity.Retailer;
import com.retailflow.retailer.service.RetailerService;
import com.retailflow.security.UserPrincipal;
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

@RestController
@RequestMapping("/api/v1/retailers")
@Tag(name = "Retailers", description = "Endpoints for managing retail outlets and assignments")
public class RetailerController {

    private final RetailerService retailerService;

    public RetailerController(RetailerService retailerService) {
        this.retailerService = retailerService;
    }

    @GetMapping
    @Operation(summary = "Get paginated retailers (scoped to assigned stores for sales reps)")
    public ResponseEntity<ApiResponse<Page<RetailerDto>>> getRetailers(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long territoryId,
            @RequestParam(required = false) Retailer.RetailerStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<RetailerDto> page = retailerService.getRetailers(
                principal.getOrganizationId(), principal, territoryId, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get retailer details by ID")
    public ResponseEntity<ApiResponse<RetailerDto>> getRetailerById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        RetailerDto retailer = retailerService.getRetailerById(principal.getOrganizationId(), principal, id);
        return ResponseEntity.ok(ApiResponse.success(retailer));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_REP')")
    @Operation(summary = "Create a new retailer")
    public ResponseEntity<ApiResponse<RetailerDto>> createRetailer(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateRetailerRequest request) {
        // If sales rep creates retailer, automatically assign them
        if (principal.getRole() == com.retailflow.user.entity.User.Role.SALES_REP) {
            if (request.getSalesRepIds() == null || request.getSalesRepIds().isEmpty()) {
                request.setSalesRepIds(java.util.List.of(principal.getId()));
            }
        }
        RetailerDto created = retailerService.createRetailer(principal.getOrganizationId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Retailer created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_REP')")
    @Operation(summary = "Update retailer details")
    public ResponseEntity<ApiResponse<RetailerDto>> updateRetailer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateRetailerRequest request) {
        RetailerDto updated = retailerService.updateRetailer(principal.getOrganizationId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Retailer updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate retailer (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteRetailer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        retailerService.deleteRetailer(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success("Retailer deactivated successfully"));
    }

    @PostMapping("/{id}/assign/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign sales representative to retailer")
    public ResponseEntity<ApiResponse<Void>> assignSalesRep(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable Long userId) {
        retailerService.assignSalesRep(principal.getOrganizationId(), id, userId);
        return ResponseEntity.ok(ApiResponse.success("Sales representative assigned"));
    }

    @DeleteMapping("/{id}/assign/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Unassign sales representative from retailer")
    public ResponseEntity<ApiResponse<Void>> unassignSalesRep(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable Long userId) {
        retailerService.unassignSalesRep(principal.getOrganizationId(), id, userId);
        return ResponseEntity.ok(ApiResponse.success("Sales representative unassigned"));
    }
}
