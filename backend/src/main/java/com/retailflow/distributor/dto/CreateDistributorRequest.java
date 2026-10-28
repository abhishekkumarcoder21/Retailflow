package com.retailflow.distributor.dto;

import com.retailflow.distributor.entity.Distributor;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDistributorRequest {

    @NotBlank(message = "Distributor name is required")
    private String name;

    private Long userId;

    private String contactPerson;

    private String phone;

    private String email;

    private String address;

    private Long territoryId;

    private Distributor.DistributorStatus status;
}
