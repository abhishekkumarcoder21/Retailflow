package com.retailflow.distributor.dto;

import com.retailflow.distributor.entity.Distributor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistributorDto {
    private Long id;
    private Long organizationId;
    private Long userId;
    private String userEmail;
    private String name;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private Long territoryId;
    private String territoryName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DistributorDto fromEntity(Distributor d) {
        return DistributorDto.builder()
                .id(d.getId())
                .organizationId(d.getOrganization().getId())
                .userId(d.getUser() != null ? d.getUser().getId() : null)
                .userEmail(d.getUser() != null ? d.getUser().getEmail() : null)
                .name(d.getName())
                .contactPerson(d.getContactPerson())
                .phone(d.getPhone())
                .email(d.getEmail())
                .address(d.getAddress())
                .territoryId(d.getTerritory() != null ? d.getTerritory().getId() : null)
                .territoryName(d.getTerritory() != null ? d.getTerritory().getName() : null)
                .status(d.getStatus().name())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
