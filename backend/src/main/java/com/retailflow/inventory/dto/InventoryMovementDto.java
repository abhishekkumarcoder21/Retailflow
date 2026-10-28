package com.retailflow.inventory.dto;

import com.retailflow.inventory.entity.InventoryMovement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementDto {
    private Long id;
    private Long organizationId;
    private Long inventoryId;
    private Long productId;
    private String productName;
    private String productSku;
    private String movementType;
    private Integer previousQuantity;
    private Integer quantityChange;
    private Integer resultingQuantity;
    private String reason;
    private String referenceType;
    private Long referenceId;
    private Long actorId;
    private String actorName;
    private LocalDateTime createdAt;

    public static InventoryMovementDto fromEntity(InventoryMovement m) {
        return InventoryMovementDto.builder()
                .id(m.getId())
                .organizationId(m.getOrganization().getId())
                .inventoryId(m.getInventory().getId())
                .productId(m.getProduct().getId())
                .productName(m.getProduct().getName())
                .productSku(m.getProduct().getSku())
                .movementType(m.getMovementType().name())
                .previousQuantity(m.getPreviousQuantity())
                .quantityChange(m.getQuantityChange())
                .resultingQuantity(m.getResultingQuantity())
                .reason(m.getReason())
                .referenceType(m.getReferenceType())
                .referenceId(m.getReferenceId())
                .actorId(m.getActor() != null ? m.getActor().getId() : null)
                .actorName(m.getActor() != null ? m.getActor().getFullName() : "System")
                .createdAt(m.getCreatedAt())
                .build();
    }
}
