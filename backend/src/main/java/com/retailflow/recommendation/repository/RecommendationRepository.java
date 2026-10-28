package com.retailflow.recommendation.repository;

import com.retailflow.recommendation.entity.Recommendation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByOrganizationIdAndStatus(
            Long organizationId, Recommendation.Status status);

    Page<Recommendation> findByOrganizationIdAndStatus(
            Long organizationId, Recommendation.Status status, Pageable pageable);

    long countByOrganizationIdAndStatus(
            Long organizationId, Recommendation.Status status);
}
