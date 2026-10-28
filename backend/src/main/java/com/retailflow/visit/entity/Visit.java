package com.retailflow.visit.entity;

import com.retailflow.common.entity.BaseEntity;
import com.retailflow.organization.entity.Organization;
import com.retailflow.retailer.entity.Retailer;
import com.retailflow.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "visits")
@Getter
@Setter
@NoArgsConstructor
public class Visit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retailer_id", nullable = false)
    private Retailer retailer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private VisitStatus status = VisitStatus.CHECKED_IN;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    private Double latitude;

    private Double longitude;

    private String notes;

    private String outcome;

    public enum VisitStatus {
        PLANNED,
        CHECKED_IN,
        COMPLETED,
        CANCELLED
    }
}
