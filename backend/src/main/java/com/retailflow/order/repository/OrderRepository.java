package com.retailflow.order.repository;

import com.retailflow.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrganizationIdAndOrderNumber(Long organizationId, String orderNumber);

    boolean existsByOrganizationIdAndOrderNumber(Long organizationId, String orderNumber);

    @Query("SELECT o FROM Order o WHERE o.organization.id = :orgId " +
           "AND (:status IS NULL OR o.status = :status) " +
           "AND (:retailerId IS NULL OR o.retailer.id = :retailerId) " +
           "AND (:distributorId IS NULL OR o.distributor.id = :distributorId) " +
           "AND (:salesRepId IS NULL OR o.salesRep.id = :salesRepId)")
    Page<Order> findFiltered(
            @Param("orgId") Long orgId,
            @Param("status") Order.OrderStatus status,
            @Param("retailerId") Long retailerId,
            @Param("distributorId") Long distributorId,
            @Param("salesRepId") Long salesRepId,
            Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.organization.id = :orgId AND o.distributor.id = :distributorId " +
           "AND (:status IS NULL OR o.status = :status)")
    Page<Order> findByDistributor(
            @Param("orgId") Long orgId,
            @Param("distributorId") Long distributorId,
            @Param("status") Order.OrderStatus status,
            Pageable pageable);

    @Query("SELECT o FROM Order o WHERE o.organization.id = :orgId AND o.salesRep.id = :salesRepId " +
           "AND (:status IS NULL OR o.status = :status)")
    Page<Order> findBySalesRep(
            @Param("orgId") Long orgId,
            @Param("salesRepId") Long salesRepId,
            @Param("status") Order.OrderStatus status,
            Pageable pageable);

    // Analytics Aggregation Queries
    long countByOrganizationId(Long organizationId);

    long countByOrganizationIdAndStatus(Long organizationId, Order.OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.organization.id = :orgId AND o.status NOT IN ('CANCELLED', 'REJECTED')")
    BigDecimal sumTotalRevenue(@Param("orgId") Long orgId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.organization.id = :orgId AND o.status = 'DELIVERED'")
    BigDecimal sumDeliveredRevenue(@Param("orgId") Long orgId);

    @Query("SELECT o FROM Order o WHERE o.organization.id = :orgId AND o.createdAt >= :since ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(@Param("orgId") Long orgId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.organization.id = :orgId AND o.retailer.id = :retailerId")
    long countByOrganizationIdAndRetailerId(@Param("orgId") Long orgId, @Param("retailerId") Long retailerId);
}
