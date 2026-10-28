package com.retailflow.order.repository;

import com.retailflow.order.entity.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, Long> {
    Optional<IdempotencyRecord> findByIdempotencyKeyAndOrganizationIdAndOperation(
            String idempotencyKey, Long organizationId, String operation);

    void deleteByExpiresAtBefore(LocalDateTime now);
}
