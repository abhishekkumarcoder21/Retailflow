package com.retailflow.recommendation.entity;

import com.retailflow.common.entity.BaseEntity;
import com.retailflow.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "recommendations")
@Getter
@Setter
@NoArgsConstructor
public class Recommendation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RecommendationType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(name = "suggested_action", columnDefinition = "TEXT")
    private String suggestedAction;

    public enum RecommendationType {
        LOW_STOCK,
        DECLINING_ORDERS,
        UNVISITED_RETAILER,
        REORDER_SUGGESTION,
        FREQUENTLY_BOUGHT_TOGETHER
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum Status {
        ACTIVE, DISMISSED, COMPLETED
    }
}
