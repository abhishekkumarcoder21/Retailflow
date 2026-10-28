package com.retailflow.territory.dto;

import com.retailflow.territory.entity.Territory;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTerritoryRequest {

    @NotBlank(message = "Territory name is required")
    private String name;

    private String description;

    private String region;

    private Territory.TerritoryStatus status;
}
