package com.retailflow.organization.dto;

import com.retailflow.organization.entity.Organization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationDto {
    private Long id;
    private String name;
    private String slug;
    private String businessType;
    private String address;
    private String phone;
    private String email;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrganizationDto fromEntity(Organization o) {
        return OrganizationDto.builder()
                .id(o.getId())
                .name(o.getName())
                .slug(o.getSlug())
                .businessType(o.getBusinessType())
                .address(o.getAddress())
                .phone(o.getPhone())
                .email(o.getEmail())
                .status(o.getStatus().name())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
