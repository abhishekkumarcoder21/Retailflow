package com.retailflow.inventory.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.inventory.dto.AdjustInventoryRequest;
import com.retailflow.inventory.dto.InventoryDto;
import com.retailflow.inventory.dto.InventoryMovementDto;
import com.retailflow.inventory.service.InventoryService;
import com.retailflow.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory", description = "Endpoints for managing stock levels and movement audit trails")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    @Operation(summary = "Get paginated inventory levels with filters")
    public ResponseEntity<ApiResponse<Page<InventoryDto>>> getInventory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long distributorId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false, defaultValue = "false") boolean lowStockOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<InventoryDto> page = inventoryService.getInventory(
                principal.getOrganizationId(), principal, distributorId, productId, lowStockOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get all low-stock alert items")
    public ResponseEntity<ApiResponse<List<InventoryDto>>> getLowStockAlerts(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<InventoryDto> list = inventoryService.getLowStockAlerts(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get inventory record by ID")
    public ResponseEntity<ApiResponse<InventoryDto>> getInventoryById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        InventoryDto inv = inventoryService.getInventoryById(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success(inv));
    }

    @GetMapping("/movements")
    @Operation(summary = "Get inventory movements ledger")
    public ResponseEntity<ApiResponse<Page<InventoryMovementDto>>> getMovements(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long inventoryId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<InventoryMovementDto> page = inventoryService.getMovements(
                principal.getOrganizationId(), inventoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'DISTRIBUTOR')")
    @Operation(summary = "Adjust inventory stock level (Admin or Distributor)")
    public ResponseEntity<ApiResponse<InventoryDto>> adjustInventory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdjustInventoryRequest request) {
        InventoryDto updated = inventoryService.adjustInventory(principal.getOrganizationId(), principal, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Inventory updated successfully"));
    }
}
