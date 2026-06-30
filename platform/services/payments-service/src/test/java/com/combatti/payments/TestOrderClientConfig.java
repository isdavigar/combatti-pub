package com.combatti.payments;

import com.combatti.payments.client.OrderClient;
import com.combatti.payments.client.OrderSnapshot;
import com.combatti.payments.service.NotFoundException;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sustituye al OrderClient real por una versión en memoria, para que el test
 * de integración del payments-service sea autocontenido (sin orders-service).
 */
@TestConfiguration
public class TestOrderClientConfig {

    @Bean
    @Primary
    public FakeOrderClient orderClient() {
        return new FakeOrderClient();
    }

    public static class FakeOrderClient implements OrderClient {

        // orderId -> [status, subtotal]
        private final Map<Long, OrderSnapshot> orders = new ConcurrentHashMap<>(Map.of(
                100L, new OrderSnapshot(100L, "PENDING", new BigDecimal("65000")),
                101L, new OrderSnapshot(101L, "PENDING", new BigDecimal("65000")),
                102L, new OrderSnapshot(102L, "PENDING", new BigDecimal("50000")),
                103L, new OrderSnapshot(103L, "PENDING", new BigDecimal("50000")),
                104L, new OrderSnapshot(104L, "PENDING", new BigDecimal("18000")),
                105L, new OrderSnapshot(105L, "PENDING", new BigDecimal("1000")),
                200L, new OrderSnapshot(200L, "PAID", new BigDecimal("1000"))
        ));

        public final Set<Long> markedPaid = ConcurrentHashMap.newKeySet();

        @Override
        public OrderSnapshot getOrder(String tenantId, Long orderId) {
            OrderSnapshot order = orders.get(orderId);
            if (order == null) {
                throw new NotFoundException("Pedido no encontrado: " + orderId);
            }
            return order;
        }

        @Override
        public void markPaid(String tenantId, Long orderId) {
            markedPaid.add(orderId);
        }
    }
}
