package com.retailflow.order;

import com.retailflow.common.exception.BusinessRuleException;
import com.retailflow.order.dto.UpdateOrderStatusRequest;
import com.retailflow.order.entity.Order;
import com.retailflow.order.repository.OrderRepository;
import com.retailflow.order.service.OrderService;
import com.retailflow.organization.entity.Organization;
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
class OrderStateMachineTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    private Organization org;
    private User admin;
    private UserPrincipal adminPrincipal;
    private Order order;

    @BeforeEach
    void setUp() {
        org = new Organization();
        org.setId(1L);

        admin = new User();
        admin.setId(10L);
        admin.setOrganization(org);
        admin.setRole(User.Role.ADMIN);
        admin.setStatus(User.UserStatus.ACTIVE);
        adminPrincipal = new UserPrincipal(admin);

        order = new Order();
        order.setId(100L);
        order.setOrganization(org);
        order.setOrderNumber("ORD-TEST-001");
        order.setStatus(Order.OrderStatus.DELIVERED);
    }

    @Test
    @DisplayName("Should reject state transition from DELIVERED to CANCELLED")
    void shouldRejectTransitionFromDeliveredToCancelled() {
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setStatus(Order.OrderStatus.CANCELLED);

        assertThrows(BusinessRuleException.class, () ->
                orderService.updateOrderStatus(1L, adminPrincipal, 100L, request));
    }

    @Test
    @DisplayName("Should reject state transition backwards from PROCESSING to CREATED")
    void shouldRejectTransitionFromProcessingToCreated() {
        order.setStatus(Order.OrderStatus.PROCESSING);
        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest request = new UpdateOrderStatusRequest();
        request.setStatus(Order.OrderStatus.CREATED);

        assertThrows(BusinessRuleException.class, () ->
                orderService.updateOrderStatus(1L, adminPrincipal, 100L, request));
    }
}
