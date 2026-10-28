package com.retailflow.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailflow.common.exception.BusinessRuleException;
import com.retailflow.common.exception.ConflictException;
import com.retailflow.common.exception.ForbiddenException;
import com.retailflow.common.exception.ResourceNotFoundException;
import com.retailflow.distributor.entity.Distributor;
import com.retailflow.distributor.repository.DistributorRepository;
import com.retailflow.inventory.entity.Inventory;
import com.retailflow.inventory.entity.InventoryMovement;
import com.retailflow.inventory.repository.InventoryMovementRepository;
import com.retailflow.inventory.repository.InventoryRepository;
import com.retailflow.order.dto.CreateOrderRequest;
import com.retailflow.order.dto.OrderDto;
import com.retailflow.order.dto.OrderItemRequest;
import com.retailflow.order.dto.UpdateOrderStatusRequest;
import com.retailflow.order.entity.IdempotencyRecord;
import com.retailflow.order.entity.Order;
import com.retailflow.order.entity.OrderItem;
import com.retailflow.order.repository.IdempotencyRecordRepository;
import com.retailflow.order.repository.OrderRepository;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.product.entity.Product;
import com.retailflow.product.repository.ProductRepository;
import com.retailflow.retailer.entity.Retailer;
import com.retailflow.retailer.repository.RetailerAssignmentRepository;
import com.retailflow.retailer.repository.RetailerRepository;
import com.retailflow.security.UserPrincipal;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrganizationRepository organizationRepository;
    private final RetailerRepository retailerRepository;
    private final RetailerAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final DistributorRepository distributorRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final IdempotencyRecordRepository idempotencyRecordRepository;
    private final ObjectMapper objectMapper;

    public OrderService(
            OrderRepository orderRepository,
            OrganizationRepository organizationRepository,
            RetailerRepository retailerRepository,
            RetailerAssignmentRepository assignmentRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            DistributorRepository distributorRepository,
            InventoryRepository inventoryRepository,
            InventoryMovementRepository movementRepository,
            IdempotencyRecordRepository idempotencyRecordRepository,
            ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.organizationRepository = organizationRepository;
        this.retailerRepository = retailerRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.distributorRepository = distributorRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.idempotencyRecordRepository = idempotencyRecordRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public Page<OrderDto> getOrders(
            Long organizationId,
            UserPrincipal principal,
            Order.OrderStatus status,
            Long retailerId,
            Long distributorId,
            Long salesRepId,
            Pageable pageable) {

        if (principal.getRole() == User.Role.SALES_REP) {
            return orderRepository.findBySalesRep(organizationId, principal.getId(), status, pageable)
                    .map(OrderDto::fromEntity);
        } else if (principal.getRole() == User.Role.DISTRIBUTOR) {
            Optional<Distributor> distOpt = distributorRepository.findByOrganizationIdAndUserId(organizationId, principal.getId());
            Long myDistId = distOpt.map(Distributor::getId).orElse(-1L);
            return orderRepository.findByDistributor(organizationId, myDistId, status, pageable)
                    .map(OrderDto::fromEntity);
        } else {
            return orderRepository.findFiltered(organizationId, status, retailerId, distributorId, salesRepId, pageable)
                    .map(OrderDto::fromEntity);
        }
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long organizationId, UserPrincipal principal, Long id) {
        Order order = findOrderInOrg(organizationId, id);
        validateOrderAccess(order, principal);
        return OrderDto.fromEntity(order);
    }

    @Transactional
    public OrderDto createOrder(
            Long organizationId,
            UserPrincipal principal,
            CreateOrderRequest request,
            String headerIdempotencyKey) {

        String key = headerIdempotencyKey != null ? headerIdempotencyKey : request.getIdempotencyKey();
        String payloadHash = hashRequest(request);

        // Idempotency check
        if (key != null && !key.isBlank()) {
            Optional<IdempotencyRecord> recordOpt = idempotencyRecordRepository
                    .findByIdempotencyKeyAndOrganizationIdAndOperation(key, organizationId, "CREATE_ORDER");

            if (recordOpt.isPresent()) {
                IdempotencyRecord record = recordOpt.get();
                if (!record.getRequestHash().equals(payloadHash)) {
                    throw new ConflictException("Idempotency key already used with different payload: " + key);
                }
                log.info("Idempotent order replay detected for key: {}", key);
                Order existing = orderRepository.findById(record.getReferenceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Original order not found"));
                return OrderDto.fromEntity(existing);
            }
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        Retailer retailer = retailerRepository.findById(request.getRetailerId())
                .orElseThrow(() -> new ResourceNotFoundException("Retailer not found: " + request.getRetailerId()));
        if (!retailer.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Retailer not found: " + request.getRetailerId());
        }

        // Validate Sales Rep assignment if creator is SALES_REP
        User salesRep = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (principal.getRole() == User.Role.SALES_REP) {
            boolean assigned = assignmentRepository.existsByRetailerIdAndUserId(retailer.getId(), principal.getId());
            if (!assigned) {
                throw new ForbiddenException("You are not assigned to create orders for retailer: " + retailer.getBusinessName());
            }
        }

        Distributor distributor = null;
        if (request.getDistributorId() != null) {
            distributor = distributorRepository.findById(request.getDistributorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Distributor not found: " + request.getDistributorId()));
            if (!distributor.getOrganization().getId().equals(organizationId)) {
                throw new ResourceNotFoundException("Distributor not found: " + request.getDistributorId());
            }
        }

        Order order = new Order();
        order.setOrganization(org);
        order.setOrderNumber(generateOrderNumber());
        order.setRetailer(retailer);
        order.setSalesRep(salesRep);
        order.setDistributor(distributor);
        order.setStatus(Order.OrderStatus.CONFIRMED); // Auto-confirmed on creation
        order.setNotes(request.getNotes());

        BigDecimal subtotal = BigDecimal.ZERO;

        // Process line items & server-side pricing
        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.getProductId()));
            if (!product.getOrganization().getId().equals(organizationId)) {
                throw new ResourceNotFoundException("Product not found: " + itemReq.getProductId());
            }
            if (product.getStatus() != Product.ProductStatus.ACTIVE) {
                throw new BusinessRuleException("Product is inactive: " + product.getName());
            }

            BigDecimal unitPrice = product.getBasePrice();
            BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setProductSku(product.getSku());
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(unitPrice);
            item.setSubtotal(itemSubtotal);
            order.addItem(item);
        }

        order.setSubtotal(subtotal);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal);

        // Deduct inventory atomically within the transaction
        deductInventoryForOrder(order, salesRep);

        order = orderRepository.save(order);

        // Save idempotency record
        if (key != null && !key.isBlank()) {
            IdempotencyRecord record = new IdempotencyRecord();
            record.setIdempotencyKey(key);
            record.setOrganization(org);
            record.setUser(salesRep);
            record.setOperation("CREATE_ORDER");
            record.setRequestHash(payloadHash);
            record.setResponseStatus(201);
            record.setReferenceId(order.getId());
            record.setExpiresAt(LocalDateTime.now().plusDays(1));
            idempotencyRecordRepository.save(record);
        }

        return OrderDto.fromEntity(order);
    }

    @Transactional
    public OrderDto updateOrderStatus(
            Long organizationId,
            UserPrincipal principal,
            Long id,
            UpdateOrderStatusRequest request) {

        Order order = findOrderInOrg(organizationId, id);
        validateOrderAccess(order, principal);

        Order.OrderStatus currentStatus = order.getStatus();
        Order.OrderStatus newStatus = request.getStatus();

        if (currentStatus == newStatus) {
            return OrderDto.fromEntity(order);
        }

        // Validate state machine transitions
        validateStateTransition(currentStatus, newStatus);

        // Role-based transition permissions
        validateRolePermissions(currentStatus, newStatus, principal, order);

        User actor = userRepository.findById(principal.getId()).orElse(null);

        // Handle inventory adjustments based on state changes
        if (newStatus == Order.OrderStatus.CANCELLED || newStatus == Order.OrderStatus.REJECTED) {
            // Restore inventory that was previously deducted
            restoreInventoryForOrder(order, actor, newStatus.name());
            if (request.getRejectionReason() != null) {
                order.setRejectionReason(request.getRejectionReason());
            }
        }

        order.setStatus(newStatus);
        order = orderRepository.save(order);

        return OrderDto.fromEntity(order);
    }

    private void deductInventoryForOrder(Order order, User actor) {
        for (OrderItem item : order.getItems()) {
            Long distId = order.getDistributor() != null ? order.getDistributor().getId() : null;
            Optional<Inventory> invOpt;
            if (distId != null) {
                invOpt = inventoryRepository.findByOrganizationIdAndProductIdAndDistributorId(
                        order.getOrganization().getId(), item.getProduct().getId(), distId);
            } else {
                invOpt = inventoryRepository.findByOrganizationIdAndProductIdAndDistributorIsNull(
                        order.getOrganization().getId(), item.getProduct().getId());
            }

            Inventory inventory = invOpt.orElseThrow(() -> new BusinessRuleException(
                    "No inventory record found for product: " + item.getProductName()));

            int prevQty = inventory.getQuantity();
            int deductQty = item.getQuantity();
            if (prevQty < deductQty) {
                throw new BusinessRuleException(String.format(
                        "Insufficient inventory for product '%s'. In stock: %d, requested: %d",
                        item.getProductName(), prevQty, deductQty));
            }

            int resultingQty = prevQty - deductQty;
            inventory.setQuantity(resultingQty);
            inventoryRepository.save(inventory);

            // Record movement
            InventoryMovement movement = new InventoryMovement();
            movement.setOrganization(order.getOrganization());
            movement.setInventory(inventory);
            movement.setProduct(item.getProduct());
            movement.setMovementType(InventoryMovement.MovementType.ORDER_DEDUCT);
            movement.setPreviousQuantity(prevQty);
            movement.setQuantityChange(-deductQty);
            movement.setResultingQuantity(resultingQty);
            movement.setReason("Deducted for Order #" + order.getOrderNumber());
            movement.setReferenceType("ORDER");
            movement.setReferenceId(order.getId());
            movement.setActor(actor);
            movementRepository.save(movement);
        }
    }

    private void restoreInventoryForOrder(Order order, User actor, String reason) {
        for (OrderItem item : order.getItems()) {
            Long distId = order.getDistributor() != null ? order.getDistributor().getId() : null;
            Optional<Inventory> invOpt;
            if (distId != null) {
                invOpt = inventoryRepository.findByOrganizationIdAndProductIdAndDistributorId(
                        order.getOrganization().getId(), item.getProduct().getId(), distId);
            } else {
                invOpt = inventoryRepository.findByOrganizationIdAndProductIdAndDistributorIsNull(
                        order.getOrganization().getId(), item.getProduct().getId());
            }

            invOpt.ifPresent(inv -> {
                int prev = inv.getQuantity();
                int restored = item.getQuantity();
                int newQty = prev + restored;
                inv.setQuantity(newQty);
                inventoryRepository.save(inv);

                InventoryMovement movement = new InventoryMovement();
                movement.setOrganization(order.getOrganization());
                movement.setInventory(inv);
                movement.setProduct(item.getProduct());
                movement.setMovementType(InventoryMovement.MovementType.ORDER_RELEASE);
                movement.setPreviousQuantity(prev);
                movement.setQuantityChange(restored);
                movement.setResultingQuantity(newQty);
                movement.setReason("Restored due to order " + reason + " #" + order.getOrderNumber());
                movement.setReferenceType("ORDER");
                movement.setReferenceId(order.getId());
                movement.setActor(actor);
                movementRepository.save(movement);
            });
        }
    }

    private void validateStateTransition(Order.OrderStatus from, Order.OrderStatus to) {
        boolean valid = switch (from) {
            case CREATED -> (to == Order.OrderStatus.CONFIRMED || to == Order.OrderStatus.CANCELLED || to == Order.OrderStatus.REJECTED);
            case CONFIRMED -> (to == Order.OrderStatus.PROCESSING || to == Order.OrderStatus.CANCELLED || to == Order.OrderStatus.REJECTED);
            case PROCESSING -> (to == Order.OrderStatus.SHIPPED || to == Order.OrderStatus.CANCELLED);
            case SHIPPED -> (to == Order.OrderStatus.DELIVERED);
            case DELIVERED, REJECTED, CANCELLED -> false;
        };

        if (!valid) {
            throw new BusinessRuleException(String.format("Invalid order status transition from %s to %s", from, to));
        }
    }

    private void validateRolePermissions(Order.OrderStatus from, Order.OrderStatus to, UserPrincipal principal, Order order) {
        if (principal.getRole() == User.Role.ADMIN) {
            return; // Admin can perform any valid transition
        }

        if (principal.getRole() == User.Role.SALES_REP) {
            // Sales Rep can only cancel orders they created before processing
            if (to == Order.OrderStatus.CANCELLED && (from == Order.OrderStatus.CREATED || from == Order.OrderStatus.CONFIRMED)) {
                if (!order.getSalesRep().getId().equals(principal.getId())) {
                    throw new ForbiddenException("You can only cancel your own orders");
                }
                return;
            }
            throw new ForbiddenException("Sales representatives cannot change status to " + to);
        }

        if (principal.getRole() == User.Role.DISTRIBUTOR) {
            // Distributor can transition CONFIRMED -> PROCESSING, PROCESSING -> SHIPPED, or REJECT
            if (to == Order.OrderStatus.PROCESSING || to == Order.OrderStatus.SHIPPED || to == Order.OrderStatus.REJECTED) {
                return;
            }
            throw new ForbiddenException("Distributors cannot change status to " + to);
        }
    }

    private void validateOrderAccess(Order order, UserPrincipal principal) {
        if (principal.getRole() == User.Role.ADMIN) {
            return;
        }
        if (principal.getRole() == User.Role.SALES_REP) {
            if (!order.getSalesRep().getId().equals(principal.getId())) {
                throw new ForbiddenException("Access denied to order: " + order.getOrderNumber());
            }
        }
        if (principal.getRole() == User.Role.DISTRIBUTOR) {
            Optional<Distributor> distOpt = distributorRepository.findByOrganizationIdAndUserId(
                    order.getOrganization().getId(), principal.getId());
            if (distOpt.isEmpty() || order.getDistributor() == null ||
                    !order.getDistributor().getId().equals(distOpt.get().getId())) {
                throw new ForbiddenException("Access denied to order: " + order.getOrderNumber());
            }
        }
    }

    private String generateOrderNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String rand = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "ORD-" + date + "-" + rand;
    }

    private String hashRequest(CreateOrderRequest req) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            StringBuilder sb = new StringBuilder();
            sb.append(req.getRetailerId()).append(":");
            sb.append(req.getDistributorId()).append(":");
            if (req.getItems() != null) {
                for (OrderItemRequest item : req.getItems()) {
                    sb.append(item.getProductId()).append("-").append(item.getQuantity()).append(";");
                }
            }
            byte[] hash = digest.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(req.hashCode());
        }
    }

    public Order findOrderInOrg(Long organizationId, Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        if (!order.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("Order not found with id: " + id);
        }
        return order;
    }
}
