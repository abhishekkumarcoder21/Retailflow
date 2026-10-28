package com.retailflow.retailer.dto;

import com.retailflow.retailer.entity.Retailer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetailerDto {
    private Long id;
    private Long organizationId;
    private String businessName;
    private String ownerName;
    private String phone;
    private String email;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private Long territoryId;
    private String territoryName;
    private String status;
    private List<Long> assignedSalesRepIds;
    private List<String> assignedSalesRepNames;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RetailerDto fromEntity(Retailer r) {
        return RetailerDto.builder()
                .id(r.getId())
                .organizationId(r.getOrganization().getId())
                .businessName(r.getBusinessName())
                .ownerName(r.getOwnerName())
                .phone(r.getPhone())
                .email(r.getEmail())
                .address(r.getAddress())
                .city(r.getCity())
                .state(r.getState())
                .postalCode(r.getPostalCode())
                .territoryId(r.getTerritory() != null ? r.getTerritory().getId() : null)
                .territoryName(r.getTerritory() != null ? r.getTerritory().getName() : null)
                .status(r.getStatus().name())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
