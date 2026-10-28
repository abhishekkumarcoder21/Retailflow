package com.retailflow.product.dto;

import com.retailflow.product.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private Long organizationId;
    private String sku;
    private String name;
    private String description;
    private String category;
    private String unit;
    private BigDecimal basePrice;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductDto fromEntity(Product p) {
        return ProductDto.builder()
                .id(p.getId())
                .organizationId(p.getOrganization().getId())
                .sku(p.getSku())
                .name(p.getName())
                .description(p.getDescription())
                .category(p.getCategory())
                .unit(p.getUnit())
                .basePrice(p.getBasePrice())
                .status(p.getStatus().name())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
