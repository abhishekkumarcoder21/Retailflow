package com.retailflow.retailer.repository;

import com.retailflow.retailer.entity.Retailer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RetailerRepository extends JpaRepository<Retailer, Long> {

    Page<Retailer> findByOrganizationId(Long organizationId, Pageable pageable);

    @Query("SELECT r FROM Retailer r WHERE r.organization.id = :orgId " +
           "AND (:territoryId IS NULL OR r.territory.id = :territoryId) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:keyword IS NULL OR LOWER(r.businessName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(r.ownerName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(r.city) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Retailer> findFiltered(
            @Param("orgId") Long orgId,
            @Param("territoryId") Long territoryId,
            @Param("status") Retailer.RetailerStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT r FROM Retailer r JOIN RetailerAssignment ra ON ra.retailer = r " +
           "WHERE r.organization.id = :orgId AND ra.user.id = :userId " +
           "AND (:territoryId IS NULL OR r.territory.id = :territoryId) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:keyword IS NULL OR LOWER(r.businessName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(r.ownerName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(r.city) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Retailer> findAssignedToUserFiltered(
            @Param("orgId") Long orgId,
            @Param("userId") Long userId,
            @Param("territoryId") Long territoryId,
            @Param("status") Retailer.RetailerStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    List<Retailer> findByOrganizationIdAndStatus(Long organizationId, Retailer.RetailerStatus status);

    long countByOrganizationId(Long organizationId);

    long countByOrganizationIdAndStatus(Long organizationId, Retailer.RetailerStatus status);
}
