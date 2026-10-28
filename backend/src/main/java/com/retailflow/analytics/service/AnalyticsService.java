package com.retailflow.analytics.service;

import com.retailflow.analytics.dto.DashboardAnalyticsDto;
import com.retailflow.inventory.repository.InventoryRepository;
import com.retailflow.order.entity.Order;
import com.retailflow.order.repository.OrderItemRepository;
import com.retailflow.order.repository.OrderRepository;
import com.retailflow.product.repository.ProductRepository;
import com.retailflow.retailer.entity.Retailer;
import com.retailflow.retailer.repository.RetailerRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RetailerRepository retailerRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public AnalyticsService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RetailerRepository retailerRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.retailerRepository = retailerRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional(readOnly = true)
    public DashboardAnalyticsDto getDashboardAnalytics(Long organizationId) {
        long totalOrders = orderRepository.countByOrganizationId(organizationId);
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue(organizationId);
        BigDecimal deliveredRevenue = orderRepository.sumDeliveredRevenue(organizationId);

        long pendingOrders = orderRepository.countByOrganizationIdAndStatus(organizationId, Order.OrderStatus.CREATED)
                + orderRepository.countByOrganizationIdAndStatus(organizationId, Order.OrderStatus.CONFIRMED)
                + orderRepository.countByOrganizationIdAndStatus(organizationId, Order.OrderStatus.PROCESSING);

        long deliveredOrders = orderRepository.countByOrganizationIdAndStatus(organizationId, Order.OrderStatus.DELIVERED);
        long activeRetailers = retailerRepository.countByOrganizationIdAndStatus(organizationId, Retailer.RetailerStatus.ACTIVE);
        long totalProducts = productRepository.countByOrganizationId(organizationId);
        long lowStockCount = inventoryRepository.countLowStock(organizationId);

        // Orders count by status
        Map<String, Long> statusMap = new HashMap<>();
        for (Order.OrderStatus status : Order.OrderStatus.values()) {
            statusMap.put(status.name(), orderRepository.countByOrganizationIdAndStatus(organizationId, status));
        }

        // Top 5 products
        List<Object[]> topRows = orderItemRepository.findTopSellingProducts(organizationId, PageRequest.of(0, 5));
        List<DashboardAnalyticsDto.TopProductDto> topProducts = topRows.stream().map(row ->
                DashboardAnalyticsDto.TopProductDto.builder()
                        .productId((Long) row[0])
                        .productName((String) row[1])
                        .productSku((String) row[2])
                        .quantitySold((Long) row[3])
                        .totalRevenue((BigDecimal) row[4])
                        .build()
        ).collect(Collectors.toList());

        // Recent 7 days trend
        LocalDateTime sevenDaysAgo = LocalDate.now().minusDays(6).atStartOfDay();
        List<Order> recentOrders = orderRepository.findRecentOrders(organizationId, sevenDaysAgo);

        Map<LocalDate, List<Order>> ordersByDay = recentOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate()));

        List<DashboardAnalyticsDto.DailySalesDto> salesTrend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            List<Order> dayOrders = ordersByDay.getOrDefault(date, Collections.emptyList());
            long count = dayOrders.size();
            BigDecimal dayRevenue = dayOrders.stream()
                    .filter(o -> o.getStatus() != Order.OrderStatus.CANCELLED && o.getStatus() != Order.OrderStatus.REJECTED)
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            salesTrend.add(DashboardAnalyticsDto.DailySalesDto.builder()
                    .date(date.format(formatter))
                    .orderCount(count)
                    .revenue(dayRevenue)
                    .build());
        }

        return DashboardAnalyticsDto.builder()
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .deliveredRevenue(deliveredRevenue)
                .pendingOrders(pendingOrders)
                .deliveredOrders(deliveredOrders)
                .activeRetailers(activeRetailers)
                .totalProducts(totalProducts)
                .lowStockCount(lowStockCount)
                .ordersByStatus(statusMap)
                .topSellingProducts(topProducts)
                .recentSalesTrend(salesTrend)
                .build();
    }
}
