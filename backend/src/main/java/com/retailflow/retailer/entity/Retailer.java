package com.retailflow.retailer.entity;

import com.retailflow.common.entity.BaseEntity;
import com.retailflow.organization.entity.Organization;
import com.retailflow.territory.entity.Territory;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "retailers")
@Getter
@Setter
@NoArgsConstructor
public class Retailer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(name = "owner_name")
    private String ownerName;

    private String phone;

    private String email;

    private String address;

    private String city;

    private String state;

    @Column(name = "postal_code")
    private String postalCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "territory_id")
    private Territory territory;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RetailerStatus status = RetailerStatus.ACTIVE;

    public enum RetailerStatus {
        ACTIVE, INACTIVE
    }
}
