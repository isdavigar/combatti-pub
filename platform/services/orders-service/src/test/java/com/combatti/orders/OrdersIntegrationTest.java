package com.combatti.orders;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.orders.domain.OrderChannel;
import com.combatti.orders.domain.OrderStatus;
import com.combatti.orders.domain.OrderType;
import com.combatti.orders.web.dto.CreateOrderRequest;
import com.combatti.orders.web.dto.OrderDto;
import com.combatti.orders.web.dto.OrderItemRequest;
import com.combatti.orders.web.dto.TableDto;
import com.combatti.orders.web.dto.UpdateStatusRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrdersIntegrationTest {

    private static final String SECRET = "dev-secret-change-me-please-change-me-32";
    private static final String ISSUER = "combatti-auth";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    private String token(List<String> permissions) {
        AuthenticatedUser user = new AuthenticatedUser(
                1L, "admin", "Administrador", "default", List.of("Administrador"), permissions);
        return jwtService.generateToken(user);
    }

    private HttpHeaders bearer(List<String> permissions) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token(permissions));
        return headers;
    }

    @Test
    void listsSeededTables() {
        ResponseEntity<TableDto[]> response = rest.exchange(
                "/api/orders/tables", HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("pos.orders"))), TableDto[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(22);
    }

    @Test
    void rejectsTablesWithoutToken() {
        ResponseEntity<String> response = rest.getForEntity("/api/orders/tables", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void createsDineInOrderAndMarksTableOccupied() {
        // Tomamos una mesa de tipo "Mesa".
        TableDto[] tables = rest.exchange(
                "/api/orders/tables", HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("pos.orders"))), TableDto[].class).getBody();
        assertThat(tables).isNotNull();
        TableDto mesa = java.util.Arrays.stream(tables)
                .filter(t -> "Mesa".equals(t.kind()))
                .findFirst()
                .orElseThrow();

        CreateOrderRequest request = new CreateOrderRequest(
                OrderType.DINE_IN, OrderChannel.LOCAL, mesa.id(),
                null, null, null, "Sin cebolla",
                List.of(
                        new OrderItemRequest(10L, "Pechuga de Pollo 300gr", new BigDecimal("30000"), 2, null),
                        new OrderItemRequest(11L, "Limonada", new BigDecimal("5000"), 1, "Sin azúcar")
                ));

        ResponseEntity<OrderDto> created = rest.exchange(
                "/api/orders", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.orders"))), OrderDto.class);

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        OrderDto order = created.getBody();
        assertThat(order).isNotNull();
        assertThat(order.status()).isEqualTo(OrderStatus.PENDING);
        assertThat(order.tableId()).isEqualTo(mesa.id());
        assertThat(order.items()).hasSize(2);
        // 30000*2 + 5000 = 65000
        assertThat(order.subtotal()).isEqualByComparingTo(new BigDecimal("65000"));

        // La mesa ahora debe figurar ocupada.
        TableDto[] tablesAfter = rest.exchange(
                "/api/orders/tables", HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("pos.orders"))), TableDto[].class).getBody();
        assertThat(tablesAfter).isNotNull();
        boolean occupied = java.util.Arrays.stream(tablesAfter)
                .anyMatch(t -> t.id().equals(mesa.id()) && t.occupied());
        assertThat(occupied).isTrue();
    }

    @Test
    void dineInWithoutTableIsRejected() {
        CreateOrderRequest request = new CreateOrderRequest(
                OrderType.DINE_IN, OrderChannel.LOCAL, null, null, null, null, null,
                List.of(new OrderItemRequest(null, "Producto", new BigDecimal("1000"), 1, null)));

        ResponseEntity<String> response = rest.exchange(
                "/api/orders", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.orders"))), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void kitchenFlowAdvancesStatus() {
        // Creamos un pedido de domicilio.
        CreateOrderRequest request = new CreateOrderRequest(
                OrderType.DELIVERY, OrderChannel.RAPPI, null,
                "Cliente", "3001234567", "Calle 1 #2-3", null,
                List.of(new OrderItemRequest(20L, "Hamburguesa", new BigDecimal("18000"), 1, null)));

        Long orderId = rest.exchange(
                "/api/orders", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.orders"))), OrderDto.class).getBody().id();

        // Cocina lista los pendientes y avanza el estado.
        ResponseEntity<OrderDto[]> kitchen = rest.exchange(
                "/api/orders/kitchen", HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("pos.kitchen"))), OrderDto[].class);
        assertThat(kitchen.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(kitchen.getBody()).isNotNull();
        assertThat(java.util.Arrays.stream(kitchen.getBody()).anyMatch(o -> o.id().equals(orderId))).isTrue();

        UpdateStatusRequest statusRequest = new UpdateStatusRequest(OrderStatus.PREPARING);
        ResponseEntity<OrderDto> updated = rest.exchange(
                "/api/orders/kitchen/" + orderId + "/status", HttpMethod.PATCH,
                new HttpEntity<>(statusRequest, bearer(List.of("pos.kitchen"))), OrderDto.class);

        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody()).isNotNull();
        assertThat(updated.getBody().status()).isEqualTo(OrderStatus.PREPARING);
    }

    @Test
    void rejectsOrderCreationWithoutPermission() {
        CreateOrderRequest request = new CreateOrderRequest(
                OrderType.TAKEAWAY, OrderChannel.LOCAL, null, null, null, null, null,
                List.of(new OrderItemRequest(null, "Producto", new BigDecimal("1000"), 1, null)));

        ResponseEntity<String> response = rest.exchange(
                "/api/orders", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("catalog.read"))), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
