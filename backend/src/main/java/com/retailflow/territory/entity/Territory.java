package com.retailflow.territory.entity;

import com.retailflow.common.entity.BaseEntity;
import com.retailflow.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "territories", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"organization_id", "name"})
})
@Getter
@Setter
@NoArgsConstructor
public class Territory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String name;

    private String description;

    private String region;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TerritoryStatus status = TerritoryStatus.ACTIVE;

    public enum TerritoryStatus {
        ACTIVE, INACTIVE
    }
}
