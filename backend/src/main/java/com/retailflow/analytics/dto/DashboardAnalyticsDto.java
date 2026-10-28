package com.retailflow.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAnalyticsDto {
    private long totalOrders;
    private BigDecimal totalRevenue;
    private BigDecimal deliveredRevenue;
    private long pendingOrders;
    private long deliveredOrders;
    private long activeRetailers;
    private long totalProducts;
    private long lowStockCount;

    private Map<String, Long> ordersByStatus;
    private List<TopProductDto> topSellingProducts;
    private List<DailySalesDto> recentSalesTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProductDto {
        private Long productId;
        private String productName;
        private String productSku;
        private Long quantitySold;
        private BigDecimal totalRevenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySalesDto {
        private String date;
        private long orderCount;
        private BigDecimal revenue;
    }
}
