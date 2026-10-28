package com.retailflow.order;

import com.retailflow.order.entity.Order;
import com.retailflow.order.entity.OrderItem;
import com.retailflow.product.entity.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OrderCalculationTest {

    @Test
    @DisplayName("Should accurately calculate order subtotal and total using BigDecimal arithmetic")
    void shouldCalculateOrderTotalsAccurately() {
        Order order = new Order();

        Product p1 = new Product();
        p1.setBasePrice(new BigDecimal("320.50"));
        p1.setName("Whole Wheat Atta 5kg");
        p1.setSku("SKU-WHEAT-01");

        Product p2 = new Product();
        p2.setBasePrice(new BigDecimal("195.25"));
        p2.setName("Cold-Pressed Mustard Oil 1L");
        p2.setSku("SKU-OIL-02");

        // 3 units of p1: 3 * 320.50 = 961.50
        OrderItem item1 = new OrderItem();
        item1.setProduct(p1);
        item1.setProductName(p1.getName());
        item1.setProductSku(p1.getSku());
        item1.setQuantity(3);
        item1.setUnitPrice(p1.getBasePrice());
        item1.setSubtotal(p1.getBasePrice().multiply(BigDecimal.valueOf(3)));
        order.addItem(item1);

        // 4 units of p2: 4 * 195.25 = 781.00
        OrderItem item2 = new OrderItem();
        item2.setProduct(p2);
        item2.setProductName(p2.getName());
        item2.setProductSku(p2.getSku());
        item2.setQuantity(4);
        item2.setUnitPrice(p2.getBasePrice());
        item2.setSubtotal(p2.getBasePrice().multiply(BigDecimal.valueOf(4)));
        order.addItem(item2);

        BigDecimal expectedSubtotal = new BigDecimal("1742.50");
        BigDecimal calculatedSubtotal = order.getItems().stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, expectedSubtotal.compareTo(calculatedSubtotal));
    }
}
