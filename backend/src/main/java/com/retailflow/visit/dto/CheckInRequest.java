package com.retailflow.visit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckInRequest {

    @NotNull(message = "Retailer ID is required")
    private Long retailerId;

    private Double latitude;

    private Double longitude;

    private String notes;
}
