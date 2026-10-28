package com.retailflow.order.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.order.dto.CreateOrderRequest;
import com.retailflow.order.dto.OrderDto;
import com.retailflow.order.dto.UpdateOrderStatusRequest;
import com.retailflow.order.entity.Order;
import com.retailflow.order.service.OrderService;
import com.retailflow.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Endpoints for order lifecycle management, pricing, and fulfillment")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @Operation(summary = "Get paginated orders with role-based visibility and filters")
    public ResponseEntity<ApiResponse<Page<OrderDto>>> getOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Order.OrderStatus status,
            @RequestParam(required = false) Long retailerId,
            @RequestParam(required = false) Long distributorId,
            @RequestParam(required = false) Long salesRepId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<OrderDto> page = orderService.getOrders(
                principal.getOrganizationId(), principal, status, retailerId, distributorId, salesRepId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details including historical line-item pricing")
    public ResponseEntity<ApiResponse<OrderDto>> getOrderById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        OrderDto order = orderService.getOrderById(principal.getOrganizationId(), principal, id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_REP')")
    @Operation(summary = "Create a new order with server-calculated totals, inventory deduction, and idempotency")
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderDto created = orderService.createOrder(
                principal.getOrganizationId(), principal, request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Order created successfully"));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Transition order status according to permitted state machine rules")
    public ResponseEntity<ApiResponse<OrderDto>> updateOrderStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        OrderDto updated = orderService.updateOrderStatus(
                principal.getOrganizationId(), principal, id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Order status updated to " + request.getStatus()));
    }
}
