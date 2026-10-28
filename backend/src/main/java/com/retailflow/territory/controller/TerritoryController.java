package com.retailflow.territory.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.security.UserPrincipal;
import com.retailflow.territory.dto.CreateTerritoryRequest;
import com.retailflow.territory.dto.TerritoryDto;
import com.retailflow.territory.service.TerritoryService;
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
@RequestMapping("/api/v1/territories")
@Tag(name = "Territories", description = "Endpoints for managing sales territories")
public class TerritoryController {

    private final TerritoryService territoryService;

    public TerritoryController(TerritoryService territoryService) {
        this.territoryService = territoryService;
    }

    @GetMapping
    @Operation(summary = "Get paginated territories")
    public ResponseEntity<ApiResponse<Page<TerritoryDto>>> getTerritories(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<TerritoryDto> page = territoryService.getTerritories(principal.getOrganizationId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/active")
    @Operation(summary = "Get list of all active territories")
    public ResponseEntity<ApiResponse<List<TerritoryDto>>> getActiveTerritories(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TerritoryDto> list = territoryService.getActiveTerritories(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get territory details by ID")
    public ResponseEntity<ApiResponse<TerritoryDto>> getTerritoryById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        TerritoryDto territory = territoryService.getTerritoryById(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success(territory));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new sales territory (Admin only)")
    public ResponseEntity<ApiResponse<TerritoryDto>> createTerritory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTerritoryRequest request) {
        TerritoryDto created = territoryService.createTerritory(principal.getOrganizationId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Territory created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update sales territory (Admin only)")
    public ResponseEntity<ApiResponse<TerritoryDto>> updateTerritory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateTerritoryRequest request) {
        TerritoryDto updated = territoryService.updateTerritory(principal.getOrganizationId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Territory updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate territory (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteTerritory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        territoryService.deleteTerritory(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success("Territory deactivated successfully"));
    }
}
