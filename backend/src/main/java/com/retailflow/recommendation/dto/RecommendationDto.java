package com.retailflow.recommendation.dto;

import com.retailflow.recommendation.entity.Recommendation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationDto {
    private Long id;
    private Long organizationId;
    private String type;
    private String title;
    private String description;
    private String entityType;
    private Long entityId;
    private String priority;
    private String status;
    private String suggestedAction;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RecommendationDto fromEntity(Recommendation r) {
        return RecommendationDto.builder()
                .id(r.getId())
                .organizationId(r.getOrganization().getId())
                .type(r.getType().name())
                .title(r.getTitle())
                .description(r.getDescription())
                .entityType(r.getEntityType())
                .entityId(r.getEntityId())
                .priority(r.getPriority().name())
                .status(r.getStatus().name())
                .suggestedAction(r.getSuggestedAction())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
