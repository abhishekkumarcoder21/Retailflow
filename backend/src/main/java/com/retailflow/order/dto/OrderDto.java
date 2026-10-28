package com.retailflow.order.dto;

import com.retailflow.order.entity.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private Long organizationId;
    private String orderNumber;
    private Long retailerId;
    private String retailerName;
    private Long salesRepId;
    private String salesRepName;
    private Long distributorId;
    private String distributorName;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String notes;
    private String rejectionReason;
    private Integer version;
    private List<OrderItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderDto fromEntity(Order order) {
        return OrderDto.builder()
                .id(order.getId())
                .organizationId(order.getOrganization().getId())
                .orderNumber(order.getOrderNumber())
                .retailerId(order.getRetailer().getId())
                .retailerName(order.getRetailer().getBusinessName())
                .salesRepId(order.getSalesRep().getId())
                .salesRepName(order.getSalesRep().getFullName())
                .distributorId(order.getDistributor() != null ? order.getDistributor().getId() : null)
                .distributorName(order.getDistributor() != null ? order.getDistributor().getName() : "Unassigned")
                .status(order.getStatus().name())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .rejectionReason(order.getRejectionReason())
                .version(order.getVersion())
                .items(order.getItems().stream().map(OrderItemDto::fromEntity).collect(Collectors.toList()))
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
