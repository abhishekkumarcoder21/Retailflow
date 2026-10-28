package com.retailflow.order.repository;

import com.retailflow.order.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT oi.product.id, oi.productName, oi.productSku, SUM(oi.quantity), SUM(oi.subtotal) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.organization.id = :orgId AND oi.order.status NOT IN ('CANCELLED', 'REJECTED') " +
           "GROUP BY oi.product.id, oi.productName, oi.productSku " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts(@Param("orgId") Long orgId, Pageable pageable);
}
