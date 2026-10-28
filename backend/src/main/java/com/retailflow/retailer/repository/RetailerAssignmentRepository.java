package com.retailflow.retailer.repository;

import com.retailflow.retailer.entity.RetailerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RetailerAssignmentRepository extends JpaRepository<RetailerAssignment, Long> {
    List<RetailerAssignment> findByRetailerId(Long retailerId);

    List<RetailerAssignment> findByUserId(Long userId);

    Optional<RetailerAssignment> findByRetailerIdAndUserId(Long retailerId, Long userId);

    boolean existsByRetailerIdAndUserId(Long retailerId, Long userId);

    void deleteByRetailerIdAndUserId(Long retailerId, Long userId);

    void deleteByRetailerId(Long retailerId);
}
