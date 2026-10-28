package com.retailflow.visit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteVisitRequest {

    @NotBlank(message = "Outcome is required")
    private String outcome;

    private String notes;
}
