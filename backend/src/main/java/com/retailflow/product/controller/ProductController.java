package com.retailflow.product.controller;

import com.retailflow.common.response.ApiResponse;
import com.retailflow.product.dto.CreateProductRequest;
import com.retailflow.product.dto.ProductDto;
import com.retailflow.product.entity.Product;
import com.retailflow.product.service.ProductService;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products", description = "Endpoints for managing products catalog and pricing")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @Operation(summary = "Get paginated products catalog with filters")
    public ResponseEntity<ApiResponse<Page<ProductDto>>> getProducts(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Product.ProductStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ProductDto> page = productService.getProducts(
                principal.getOrganizationId(), category, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/active")
    @Operation(summary = "Get list of all active products")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getActiveProducts(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ProductDto> list = productService.getActiveProducts(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all distinct product categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<String> categories = productService.getCategories(principal.getOrganizationId());
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product details by ID")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        ProductDto product = productService.getProductById(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create product (Admin only)")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateProductRequest request) {
        ProductDto created = productService.createProduct(principal.getOrganizationId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Product created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update product details (Admin only)")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateProductRequest request) {
        ProductDto updated = productService.updateProduct(principal.getOrganizationId(), id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate product (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        productService.deleteProduct(principal.getOrganizationId(), id);
        return ResponseEntity.ok(ApiResponse.success("Product deactivated successfully"));
    }
}
