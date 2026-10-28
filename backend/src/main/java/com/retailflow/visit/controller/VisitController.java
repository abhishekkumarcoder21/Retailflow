package com.retailflow.visit.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.security.UserPrincipal;
import com.retailflow.visit.dto.CheckInRequest;
import com.retailflow.visit.dto.CompleteVisitRequest;
import com.retailflow.visit.dto.VisitDto;
import com.retailflow.visit.entity.Visit;
import com.retailflow.visit.service.VisitService;
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
@RequestMapping("/api/v1/visits")
@Tag(name = "Visits", description = "Endpoints for sales rep visits and store check-in logging")
public class VisitController {

    private final VisitService visitService;

    public VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    @GetMapping
    @Operation(summary = "Get paginated visits list")
    public ResponseEntity<ApiResponse<Page<VisitDto>>> getVisits(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long retailerId,
            @RequestParam(required = false) Visit.VisitStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<VisitDto> page = visitService.getVisits(
                principal.getOrganizationId(), principal, retailerId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get visit details by ID")
    public ResponseEntity<ApiResponse<VisitDto>> getVisitById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        VisitDto visit = visitService.getVisitById(principal.getOrganizationId(), principal, id);
        return ResponseEntity.ok(ApiResponse.success(visit));
    }

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_REP')")
    @Operation(summary = "Record store check-in with optional GPS coordinates")
    public ResponseEntity<ApiResponse<VisitDto>> checkIn(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckInRequest request) {
        VisitDto created = visitService.checkIn(principal.getOrganizationId(), principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Checked in successfully"));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_REP')")
    @Operation(summary = "Complete visit and record outcome")
    public ResponseEntity<ApiResponse<VisitDto>> completeVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CompleteVisitRequest request) {
        VisitDto completed = visitService.completeVisit(principal.getOrganizationId(), principal, id, request);
        return ResponseEntity.ok(ApiResponse.success(completed, "Visit completed"));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_REP')")
    @Operation(summary = "Cancel scheduled or active visit")
    public ResponseEntity<ApiResponse<VisitDto>> cancelVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        VisitDto cancelled = visitService.cancelVisit(principal.getOrganizationId(), principal, id);
        return ResponseEntity.ok(ApiResponse.success(cancelled, "Visit cancelled"));
    }
}
