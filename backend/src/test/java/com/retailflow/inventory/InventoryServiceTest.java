package com.retailflow.inventory;

import com.retailflow.common.exception.BusinessRuleException;
import com.retailflow.inventory.dto.AdjustInventoryRequest;
import com.retailflow.inventory.entity.Inventory;
import com.retailflow.inventory.entity.InventoryMovement;
import com.retailflow.inventory.repository.InventoryMovementRepository;
import com.retailflow.inventory.repository.InventoryRepository;
import com.retailflow.inventory.service.InventoryService;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.product.entity.Product;
import com.retailflow.product.repository.ProductRepository;
import com.retailflow.security.UserPrincipal;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private InventoryMovementRepository movementRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Organization org;
    private Product product;
    private Inventory inventory;
    private UserPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        org = new Organization();
        org.setId(1L);

        product = new Product();
        product.setId(10L);
        product.setName("Wheat Flour 5kg");
        product.setOrganization(org);

        inventory = new Inventory();
        inventory.setId(50L);
        inventory.setOrganization(org);
        inventory.setProduct(product);
        inventory.setQuantity(10);

        User admin = new User();
        admin.setId(1L);
        admin.setOrganization(org);
        admin.setRole(User.Role.ADMIN);
        adminPrincipal = new UserPrincipal(admin);
    }

    @Test
    @DisplayName("Should throw BusinessRuleException when stock adjustment produces negative inventory")
    void shouldThrowExceptionWhenDeductingMoreThanAvailableStock() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(inventoryRepository.findByOrganizationIdAndProductIdAndDistributorIsNull(1L, 10L))
                .thenReturn(Optional.of(inventory));
        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));

        AdjustInventoryRequest request = AdjustInventoryRequest.builder()
                .productId(10L)
                .quantityChange(-15) // Available is only 10
                .movementType(InventoryMovement.MovementType.STOCK_OUT)
                .build();

        assertThrows(BusinessRuleException.class, () ->
                inventoryService.adjustInventory(1L, adminPrincipal, request));
    }
}
