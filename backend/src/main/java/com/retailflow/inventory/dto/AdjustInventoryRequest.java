package com.retailflow.inventory.dto;

import com.retailflow.inventory.entity.InventoryMovement;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustInventoryRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    private Long distributorId;

    @NotNull(message = "Quantity change is required")
    private Integer quantityChange;

    @NotNull(message = "Movement type is required")
    private InventoryMovement.MovementType movementType;

    private String reason;

    private Integer lowStockThreshold;
}
