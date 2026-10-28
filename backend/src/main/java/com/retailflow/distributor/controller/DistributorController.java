package com.retailflow.distributor.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.distributor.dto.CreateDistributorRequest;
import com.retailflow.distributor.dto.DistributorDto;
import com.retailflow.distributor.service.DistributorService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/distributors")
@Tag(name = "Distributors", description = "Endpoints for managing distribution partners")
public class DistributorController {

    private final DistributorService distributorService;

    public DistributorController(DistributorService distributorService) {
        this.distributorService = distributorService;
    }

    @GetMapping
    @Operation(summary = "Get paginated distributors")
    public ResponseEntity<ApiResponse<Page<DistributorDto>>> getDistributors(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<DistributorDto> page = distributorService.getDistributors(principal.getOrganizationId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/active")
    @Operation(summary = "Get list of active distributors")
    public ResponseEntity<ApiResponse<List<DistributorDto>>> getActiveDistributors(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<DistributorDto> list = distributorService.getActiveDistributors(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get distributor by ID")
    public ResponseEntity<ApiResponse<DistributorDto>> getDistributorById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        DistributorDto d = distributorService.getDistributorById(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success(d));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create distributor (Admin only)")
    public ResponseEntity<ApiResponse<DistributorDto>> createDistributor(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateDistributorRequest request) {
        DistributorDto created = distributorService.createDistributor(principal.getOrganizationId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Distributor created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update distributor (Admin only)")
    public ResponseEntity<ApiResponse<DistributorDto>> updateDistributor(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateDistributorRequest request) {
        DistributorDto updated = distributorService.updateDistributor(principal.getOrganizationId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Distributor updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate distributor (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteDistributor(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        distributorService.deleteDistributor(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success("Distributor deactivated successfully"));
    }
}
