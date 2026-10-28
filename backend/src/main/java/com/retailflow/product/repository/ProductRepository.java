package com.retailflow.product.repository;

import com.retailflow.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByOrganizationIdAndSku(Long organizationId, String sku);

    boolean existsByOrganizationIdAndSku(Long organizationId, String sku);

    @Query("SELECT p FROM Product p WHERE p.organization.id = :orgId " +
           "AND (:category IS NULL OR p.category = :category) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> findFiltered(
            @Param("orgId") Long orgId,
            @Param("category") String category,
            @Param("status") Product.ProductStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);

    List<Product> findByOrganizationIdAndStatus(Long organizationId, Product.ProductStatus status);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.organization.id = :orgId AND p.category IS NOT NULL")
    List<String> findDistinctCategories(@Param("orgId") Long orgId);

    long countByOrganizationId(Long organizationId);

    long countByOrganizationIdAndStatus(Long organizationId, Product.ProductStatus status);
}
