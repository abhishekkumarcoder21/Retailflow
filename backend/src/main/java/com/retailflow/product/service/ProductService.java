package com.retailflow.product.service;

import com.retailflow.common.exception.ConflictException;
import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.product.dto.CreateProductRequest;
import com.retailflow.product.dto.ProductDto;
import com.retailflow.product.entity.Product;
import com.retailflow.product.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final OrganizationRepository organizationRepository;

    public ProductService(ProductRepository productRepository, OrganizationRepository organizationRepository) {
        this.productRepository = productRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public Page<ProductDto> getProducts(
            Long organizationId,
            String category,
            Product.ProductStatus status,
            String keyword,
            Pageable pageable) {
        return productRepository.findFiltered(organizationId, category, status, keyword, pageable)
                .map(ProductDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getActiveProducts(Long organizationId) {
        return productRepository.findByOrganizationIdAndStatus(organizationId, Product.ProductStatus.ACTIVE)
                .stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long organizationId, Long id) {
        return ProductDto.fromEntity(findProductInOrg(organizationId, id));
    }

    @Transactional(readOnly = true)
    public List<String> getCategories(Long organizationId) {
        return productRepository.findDistinctCategories(organizationId);
    }

    @Transactional
    public ProductDto createProduct(Long organizationId, CreateProductRequest request) {
        if (productRepository.existsByOrganizationIdAndSku(organizationId, request.getSku())) {
            throw new ConflictException("Product already exists with SKU: " + request.getSku());
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Product product = new Product();
        product.setOrganization(org);
        product.setSku(request.getSku().toUpperCase().trim());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setUnit(request.getUnit() != null ? request.getUnit() : "PIECE");
        product.setBasePrice(request.getBasePrice());
        product.setStatus(request.getStatus() != null ? request.getStatus() : Product.ProductStatus.ACTIVE);

        product = productRepository.save(product);
        return ProductDto.fromEntity(product);
    }

    @Transactional
    public ProductDto updateProduct(Long organizationId, Long id, CreateProductRequest request) {
        Product product = findProductInOrg(organizationId, id);

        if (!product.getSku().equalsIgnoreCase(request.getSku()) &&
                productRepository.existsByOrganizationIdAndSku(organizationId, request.getSku())) {
            throw new ConflictException("Product already exists with SKU: " + request.getSku());
        }

        product.setSku(request.getSku().toUpperCase().trim());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        if (request.getUnit() != null) product.setUnit(request.getUnit());
        product.setBasePrice(request.getBasePrice());
        if (request.getStatus() != null) product.setStatus(request.getStatus());

        product = productRepository.save(product);
        return ProductDto.fromEntity(product);
    }

    @Transactional
    public void deleteProduct(Long organizationId, Long id) {
        Product product = findProductInOrg(organizationId, id);
        product.setStatus(Product.ProductStatus.INACTIVE);
        productRepository.save(product);
    }

    public Product findProductInOrg(Long organizationId, Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        if (!product.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }
        return product;
    }
}
