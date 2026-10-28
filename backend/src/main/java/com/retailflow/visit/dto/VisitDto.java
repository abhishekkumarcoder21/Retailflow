package com.retailflow.visit.dto;

import com.retailflow.visit.entity.Visit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitDto {
    private Long id;
    private Long organizationId;
    private Long retailerId;
    private String retailerName;
    private Long userId;
    private String userName;
    private String status;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private Double latitude;
    private Double longitude;
    private String notes;
    private String outcome;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VisitDto fromEntity(Visit v) {
        return VisitDto.builder()
                .id(v.getId())
                .organizationId(v.getOrganization().getId())
                .retailerId(v.getRetailer().getId())
                .retailerName(v.getRetailer().getBusinessName())
                .userId(v.getUser().getId())
                .userName(v.getUser().getFullName())
                .status(v.getStatus().name())
                .checkInTime(v.getCheckInTime())
                .checkOutTime(v.getCheckOutTime())
                .latitude(v.getLatitude())
                .longitude(v.getLongitude())
                .notes(v.getNotes())
                .outcome(v.getOutcome())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }
}
