package com.retailflow.distributor.repository;

import com.retailflow.distributor.entity.Distributor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DistributorRepository extends JpaRepository<Distributor, Long> {
    Page<Distributor> findByOrganizationId(Long organizationId, Pageable pageable);

    List<Distributor> findByOrganizationIdAndStatus(Long organizationId, Distributor.DistributorStatus status);

    Optional<Distributor> findByOrganizationIdAndUserId(Long organizationId, Long userId);

    Optional<Distributor> findByUserId(Long userId);

    long countByOrganizationId(Long organizationId);
}
