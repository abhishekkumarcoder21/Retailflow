package com.retailflow.inventory.service;

import com.retailflow.common.exception.BusinessRuleException;
import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.distributor.entity.Distributor;
import com.retailflow.distributor.repository.DistributorRepository;
import com.retailflow.inventory.dto.AdjustInventoryRequest;
import com.retailflow.inventory.dto.InventoryDto;
import com.retailflow.inventory.dto.InventoryMovementDto;
import com.retailflow.inventory.entity.Inventory;
import com.retailflow.inventory.entity.InventoryMovement;
import com.retailflow.inventory.repository.InventoryMovementRepository;
import com.retailflow.inventory.repository.InventoryRepository;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.product.entity.Product;
import com.retailflow.product.repository.ProductRepository;
import com.retailflow.security.UserPrincipal;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final ProductRepository productRepository;
    private final DistributorRepository distributorRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            InventoryMovementRepository movementRepository,
            ProductRepository productRepository,
            DistributorRepository distributorRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.productRepository = productRepository;
        this.distributorRepository = distributorRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<InventoryDto> getInventory(
            Long organizationId,
            UserPrincipal principal,
            Long distributorId,
            Long productId,
            boolean lowStockOnly,
            Pageable pageable) {

        // If user is a distributor, restrict to their distributor operation
        Long targetDistributorId = distributorId;
        if (principal.getRole() == User.Role.DISTRIBUTOR) {
            Optional<Distributor> distOpt = distributorRepository.findByOrganizationIdAndUserId(organizationId, principal.getId());
            targetDistributorId = distOpt.map(Distributor::getId).orElse(null);
        }

        return inventoryRepository.findFiltered(organizationId, targetDistributorId, productId, lowStockOnly, pageable)
                .map(InventoryDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public InventoryDto getInventoryById(Long organizationId, Long id) {
        Inventory inv = findInventoryInOrg(organizationId, id);
        return InventoryDto.fromEntity(inv);
    }

    @Transactional(readOnly = true)
    public List<InventoryDto> getLowStockAlerts(Long organizationId) {
        return inventoryRepository.findLowStock(organizationId)
                .stream()
                .map(InventoryDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<InventoryMovementDto> getMovements(Long organizationId, Long inventoryId, Pageable pageable) {
        if (inventoryId != null) {
            return movementRepository.findByOrganizationIdAndInventoryId(organizationId, inventoryId, pageable)
                    .map(InventoryMovementDto::fromEntity);
        }
        return movementRepository.findByOrganizationId(organizationId, pageable)
                .map(InventoryMovementDto::fromEntity);
    }

    @Transactional
    public InventoryDto adjustInventory(
            Long organizationId,
            UserPrincipal principal,
            AdjustInventoryRequest request) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));
        if (!product.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Product not found: " + request.getProductId());
        }

        Distributor distributor = null;
        if (request.getDistributorId() != null) {
            distributor = distributorRepository.findById(request.getDistributorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Distributor not found: " + request.getDistributorId()));
            if (!distributor.getOrganization().getId().equals(organizationId)) {
                throw new ResourceNotFoundException("Distributor not found: " + request.getDistributorId());
            }
        }

        // Find or create inventory record
        Optional<Inventory> existing;
        if (distributor != null) {
            existing = inventoryRepository.findByOrganizationIdAndProductIdAndDistributorId(
                    organizationId, product.getId(), distributor.getId());
        } else {
            existing = inventoryRepository.findByOrganizationIdAndProductIdAndDistributorIsNull(
                    organizationId, product.getId());
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Inventory inventory = existing.orElseGet(() -> {
            Inventory inv = new Inventory();
            inv.setOrganization(org);
            inv.setProduct(product);
            inv.setDistributor(finalDistributor(request.getDistributorId(), organizationId));
            inv.setQuantity(0);
            inv.setLowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 10);
            return inv;
        });

        int prevQty = inventory.getQuantity();
        int change = request.getQuantityChange();
        int newQty = prevQty + change;

        if (newQty < 0) {
            throw new BusinessRuleException(String.format(
                    "Insufficient inventory for product '%s'. Current quantity is %d, requested change is %d.",
                    product.getName(), prevQty, change));
        }

        inventory.setQuantity(newQty);
        if (request.getLowStockThreshold() != null) {
            inventory.setLowStockThreshold(request.getLowStockThreshold());
        }

        inventory = inventoryRepository.save(inventory);

        // Record movement ledger
        User actor = userRepository.findById(principal.getId()).orElse(null);
        InventoryMovement movement = new InventoryMovement();
        movement.setOrganization(org);
        movement.setInventory(inventory);
        movement.setProduct(product);
        movement.setMovementType(request.getMovementType());
        movement.setPreviousQuantity(prevQty);
        movement.setQuantityChange(change);
        movement.setResultingQuantity(newQty);
        movement.setReason(request.getReason() != null ? request.getReason() : "Manual adjustment");
        movement.setReferenceType("MANUAL_ADJUSTMENT");
        movement.setActor(actor);

        movementRepository.save(movement);

        return InventoryDto.fromEntity(inventory);
    }

    private Distributor finalDistributor(Long distributorId, Long organizationId) {
        if (distributorId == null) return null;
        return distributorRepository.findById(distributorId).orElse(null);
    }

    public Inventory findInventoryInOrg(Long organizationId, Long id) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found with id: " + id));
        if (!inv.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Inventory not found with id: " + id);
        }
        return inv;
    }
}
