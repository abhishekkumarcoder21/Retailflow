package com.retailflow.inventory.dto;

import com.retailflow.inventory.entity.Inventory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDto {
    private Long id;
    private Long organizationId;
    private Long productId;
    private String productName;
    private String productSku;
    private String productCategory;
    private Long distributorId;
    private String distributorName;
    private Integer quantity;
    private Integer lowStockThreshold;
    private boolean isLowStock;
    private Integer version;
    private LocalDateTime updatedAt;

    public static InventoryDto fromEntity(Inventory i) {
        return InventoryDto.builder()
                .id(i.getId())
                .organizationId(i.getOrganization().getId())
                .productId(i.getProduct().getId())
                .productName(i.getProduct().getName())
                .productSku(i.getProduct().getSku())
                .productCategory(i.getProduct().getCategory())
                .distributorId(i.getDistributor() != null ? i.getDistributor().getId() : null)
                .distributorName(i.getDistributor() != null ? i.getDistributor().getName() : "Central Warehouse")
                .quantity(i.getQuantity())
                .lowStockThreshold(i.getLowStockThreshold())
                .isLowStock(i.getQuantity() <= i.getLowStockThreshold())
                .version(i.getVersion())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}
