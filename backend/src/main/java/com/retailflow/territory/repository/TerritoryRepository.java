package com.retailflow.territory.repository;

import com.retailflow.territory.entity.Territory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TerritoryRepository extends JpaRepository<Territory, Long> {
    List<Territory> findByOrganizationIdAndStatus(Long organizationId, Territory.TerritoryStatus status);

    Page<Territory> findByOrganizationId(Long organizationId, Pageable pageable);

    Optional<Territory> findByOrganizationIdAndName(Long organizationId, String name);

    boolean existsByOrganizationIdAndName(Long organizationId, String name);

    long countByOrganizationId(Long organizationId);
}
