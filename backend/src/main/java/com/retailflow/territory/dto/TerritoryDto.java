package com.retailflow.territory.dto;

import com.retailflow.territory.entity.Territory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TerritoryDto {
    private Long id;
    private Long organizationId;
    private String name;
    private String description;
    private String region;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TerritoryDto fromEntity(Territory territory) {
        return TerritoryDto.builder()
                .id(territory.getId())
                .organizationId(territory.getOrganization().getId())
                .name(territory.getName())
                .description(territory.getDescription())
                .region(territory.getRegion())
                .status(territory.getStatus().name())
                .createdAt(territory.getCreatedAt())
                .updatedAt(territory.getUpdatedAt())
                .build();
    }
}
