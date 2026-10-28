package com.retailflow.retailer.dto;

import com.retailflow.retailer.entity.Retailer;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRetailerRequest {

    @NotBlank(message = "Business name is required")
    private String businessName;

    private String ownerName;

    private String phone;

    private String email;

    private String address;

    private String city;

    private String state;

    private String postalCode;

    private Long territoryId;

    private Retailer.RetailerStatus status;

    private List<Long> salesRepIds;
}
