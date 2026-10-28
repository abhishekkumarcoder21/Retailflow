package com.retailflow.audit.controller;

import com.retailflow.audit.dto.AuditLogDto;
import com.retailflow.audit.service.AuditLogService;
import com.retailflow.common.response.ApiResponse;
import com.retailflow.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@Tag(name = "Audit Logs", description = "Endpoints for viewing administrative security audit logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Operation(summary = "Get paginated system audit logs (Admin only)")
    public ResponseEntity<ApiResponse<Page<AuditLogDto>>> getAuditLogs(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AuditLogDto> page = auditLogService.getAuditLogs(principal.getOrganizationId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }
}
