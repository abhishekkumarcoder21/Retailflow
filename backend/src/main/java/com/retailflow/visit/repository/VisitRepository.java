package com.retailflow.visit.repository;

import com.retailflow.visit.entity.Visit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {

    @Query("SELECT v FROM Visit v WHERE v.organization.id = :orgId " +
           "AND (:userId IS NULL OR v.user.id = :userId) " +
           "AND (:retailerId IS NULL OR v.retailer.id = :retailerId) " +
           "AND (:status IS NULL OR v.status = :status)")
    Page<Visit> findFiltered(
            @Param("orgId") Long orgId,
            @Param("userId") Long userId,
            @Param("retailerId") Long retailerId,
            @Param("status") Visit.VisitStatus status,
            Pageable pageable);

    List<Visit> findByOrganizationIdAndUserIdAndStatus(
            Long organizationId, Long userId, Visit.VisitStatus status);

    Optional<Visit> findTopByOrganizationIdAndRetailerIdOrderByCheckInTimeDesc(
            Long organizationId, Long retailerId);

    long countByOrganizationId(Long organizationId);

    long countByOrganizationIdAndCheckInTimeAfter(Long organizationId, LocalDateTime after);
}
