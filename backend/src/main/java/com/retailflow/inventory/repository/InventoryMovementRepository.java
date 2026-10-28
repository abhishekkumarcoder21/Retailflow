package com.retailflow.inventory.repository;

import com.retailflow.inventory.entity.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    Page<InventoryMovement> findByOrganizationId(Long organizationId, Pageable pageable);

    Page<InventoryMovement> findByOrganizationIdAndInventoryId(
            Long organizationId, Long inventoryId, Pageable pageable);

    List<InventoryMovement> findTop10ByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
}
