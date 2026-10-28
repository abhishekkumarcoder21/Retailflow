package com.retailflow.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.retailflow.auth.dto.LoginRequest;
import com.retailflow.inventory.dto.InventoryDto;
import com.retailflow.inventory.service.InventoryService;
import com.retailflow.order.dto.CreateOrderRequest;
import com.retailflow.order.dto.OrderItemRequest;
import com.retailflow.product.dto.ProductDto;
import com.retailflow.product.service.ProductService;
import com.retailflow.retailer.dto.RetailerDto;
import com.retailflow.retailer.service.RetailerService;
import com.retailflow.security.UserPrincipal;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RetailerService retailerService;

    @Autowired
    private ProductService productService;

    @Autowired
    private InventoryService inventoryService;

    @Test
    @DisplayName("Complete end-to-end order workflow: login, create order, verify pricing, verify stock deduction, and idempotency replay")
    void shouldExecuteCompleteOrderWorkflow() throws Exception {
        // 1. Login as Sales Rep
        LoginRequest loginReq = LoginRequest.builder()
                .email("sales.rep@retailflow.com")
                .password("Password123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = loginJson.get("data").get("token").asText();
        Long orgId = loginJson.get("data").get("organizationId").asLong();

        User rep = userRepository.findByEmail("sales.rep@retailflow.com").orElseThrow();
        UserPrincipal repPrincipal = new UserPrincipal(rep);

        // 2. Fetch assigned retailer and product
        Page<RetailerDto> retailers = retailerService.getRetailers(orgId, repPrincipal, null, null, null, PageRequest.of(0, 10));
        RetailerDto assignedRetailer = retailers.getContent().get(0);

        List<ProductDto> products = productService.getActiveProducts(orgId);
        ProductDto product = products.get(0); // Wheat Atta: 320.00

        // Get initial inventory level for distributor 1
        Page<InventoryDto> initialInv = inventoryService.getInventory(orgId, repPrincipal, 1L, product.getId(), false, PageRequest.of(0, 1));
        int initialStock = initialInv.getContent().get(0).getQuantity();

        // 3. Create Order for 2 units
        String idempotencyKey = "TEST-IDEMP-" + UUID.randomUUID();
        CreateOrderRequest orderReq = CreateOrderRequest.builder()
                .retailerId(assignedRetailer.getId())
                .distributorId(1L)
                .items(List.of(OrderItemRequest.builder()
                        .productId(product.getId())
                        .quantity(2)
                        .build()))
                .notes("Integration test automated order")
                .build();

        MvcResult orderResult = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andReturn();

        JsonNode orderJson = objectMapper.readTree(orderResult.getResponse().getContentAsString());
        String orderNumber = orderJson.get("data").get("orderNumber").asText();
        BigDecimal expectedTotal = product.getBasePrice().multiply(BigDecimal.valueOf(2));
        BigDecimal returnedTotal = new BigDecimal(orderJson.get("data").get("totalAmount").asText());
        assertEquals(0, expectedTotal.compareTo(returnedTotal));

        // 4. Verify inventory deducted by 2
        Page<InventoryDto> afterInv = inventoryService.getInventory(orgId, repPrincipal, 1L, product.getId(), false, PageRequest.of(0, 1));
        int afterStock = afterInv.getContent().get(0).getQuantity();
        assertEquals(initialStock - 2, afterStock);

        // 5. Test Idempotency Replay with same key
        MvcResult replayResult = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.orderNumber").value(orderNumber))
                .andReturn();

        // Stock must STILL be initialStock - 2 (no double deduction)
        Page<InventoryDto> replayInv = inventoryService.getInventory(orgId, repPrincipal, 1L, product.getId(), false, PageRequest.of(0, 1));
        assertEquals(initialStock - 2, replayInv.getContent().get(0).getQuantity());

        // 6. Test security: rep cannot create order for unassigned retailer
        // Retailer 4 ("Evergreen Organics") was assigned to Elena, not Marcus
        CreateOrderRequest unauthorizedOrderReq = CreateOrderRequest.builder()
                .retailerId(4L)
                .items(List.of(OrderItemRequest.builder().productId(product.getId()).quantity(1).build()))
                .build();

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unauthorizedOrderReq)))
                .andExpect(status().isForbidden());
    }
}
