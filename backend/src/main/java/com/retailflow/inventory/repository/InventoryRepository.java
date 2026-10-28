package com.retailflow.inventory.repository;

import com.retailflow.inventory.entity.Inventory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByOrganizationIdAndProductIdAndDistributorId(
            Long organizationId, Long productId, Long distributorId);

    Optional<Inventory> findByOrganizationIdAndProductIdAndDistributorIsNull(
            Long organizationId, Long productId);

    Page<Inventory> findByOrganizationId(Long organizationId, Pageable pageable);

    Page<Inventory> findByOrganizationIdAndDistributorId(
            Long organizationId, Long distributorId, Pageable pageable);

    @Query("SELECT i FROM Inventory i WHERE i.organization.id = :orgId " +
           "AND (:distributorId IS NULL OR i.distributor.id = :distributorId) " +
           "AND (:productId IS NULL OR i.product.id = :productId) " +
           "AND (:lowStockOnly = false OR i.quantity <= i.lowStockThreshold)")
    Page<Inventory> findFiltered(
            @Param("orgId") Long orgId,
            @Param("distributorId") Long distributorId,
            @Param("productId") Long productId,
            @Param("lowStockOnly") boolean lowStockOnly,
            Pageable pageable);

    @Query("SELECT i FROM Inventory i WHERE i.organization.id = :orgId AND i.quantity <= i.lowStockThreshold")
    List<Inventory> findLowStock(@Param("orgId") Long orgId);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.organization.id = :orgId AND i.quantity <= i.lowStockThreshold")
    long countLowStock(@Param("orgId") Long orgId);

    long countByOrganizationId(Long organizationId);
}
