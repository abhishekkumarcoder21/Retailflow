package com.retailflow.recommendation.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.recommendation.dto.RecommendationDto;
import com.retailflow.recommendation.service.RecommendationService;
import com.retailflow.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@Tag(name = "Recommendations", description = "Endpoints for deterministic AI-assisted sales recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    @Operation(summary = "Get active intelligent sales recommendations")
    public ResponseEntity<ApiResponse<List<RecommendationDto>>> getRecommendations(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<RecommendationDto> list = recommendationService.getActiveRecommendations(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Trigger rule evaluation to refresh recommendations")
    public ResponseEntity<ApiResponse<List<RecommendationDto>>> refreshRecommendations(
            @AuthenticationPrincipal UserPrincipal principal) {
        recommendationService.refreshRecommendations(principal.getOrganizationId());
        List<RecommendationDto> list = recommendationService.getActiveRecommendations(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(list, "Recommendations updated"));
    }

    @PostMapping("/{id}/dismiss")
    @Operation(summary = "Dismiss an active recommendation")
    public ResponseEntity<ApiResponse<RecommendationDto>> dismissRecommendation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        RecommendationDto rec = recommendationService.dismissRecommendation(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success(rec, "Recommendation dismissed"));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark a recommendation as actioned/completed")
    public ResponseEntity<ApiResponse<RecommendationDto>> completeRecommendation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        RecommendationDto rec = recommendationService.completeRecommendation(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success(rec, "Recommendation completed"));
    }
}
