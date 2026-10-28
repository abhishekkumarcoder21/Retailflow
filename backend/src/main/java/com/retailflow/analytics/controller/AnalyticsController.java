package com.retailflow.analytics.controller;

import com.retailflow.analytics.dto.DashboardAnalyticsDto;
import com.retailflow.analytics.service.AnalyticsService;
import com.retailflow.common.response.ApiResponse;
import com.retailflow.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics", description = "Endpoints for dashboard metrics, KPI aggregations, and trends")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get aggregated business KPIs, revenue metrics, top products, and trends")
    public ResponseEntity<ApiResponse<DashboardAnalyticsDto>> getDashboardAnalytics(
            @AuthenticationPrincipal UserPrincipal principal) {
        DashboardAnalyticsDto analytics = analyticsService.getDashboardAnalytics(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}
