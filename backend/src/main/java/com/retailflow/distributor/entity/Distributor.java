package com.retailflow.distributor.entity;

import com.retailflow.common.entity.BaseEntity;
import com.retailflow.organization.entity.Organization;
import com.retailflow.territory.entity.Territory;
import com.retailflow.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "distributors")
@Getter
@Setter
@NoArgsConstructor
public class Distributor extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "contact_person")
    private String contactPerson;

    private String phone;

    private String email;

    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "territory_id")
    private Territory territory;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private DistributorStatus status = DistributorStatus.ACTIVE;

    public enum DistributorStatus {
        ACTIVE, INACTIVE
    }
}
