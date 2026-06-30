package com.combatti.orders;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.orders.realtime.OrderEventsPublisher;
import com.combatti.orders.web.dto.CreateOrderRequest;
import com.combatti.orders.web.dto.OrderDto;
import com.combatti.orders.web.dto.OrderItemRequest;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

/**
 * Verifica que las operaciones de pedidos publican eventos de tiempo real.
 * La entrega real por STOMP/WebSocket queda cubierta por la carga de contexto
 * (WebSocketConfig + interceptor); aquí comprobamos el cableado de publicación
 * de forma determinista.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class RealtimeEventsTest {

    private static final String SECRET = "dev-secret-change-me-please-change-me-32";
    private static final String ISSUER = "combatti-auth";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    @MockBean
    private OrderEventsPublisher eventsPublisher;

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    private HttpHeaders bearer() {
        AuthenticatedUser user = new AuthenticatedUser(
                1L, "mesero", "Mesero", "default", List.of("Mesero"), List.of("pos.orders"));
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtService.generateToken(user));
        return headers;
    }

    @Test
    void creatingOrderPublishesCreatedEvent() {
        CreateOrderRequest request = new CreateOrderRequest(
                com.combatti.orders.domain.OrderType.DELIVERY,
                com.combatti.orders.domain.OrderChannel.RAPPI,
                null, "Cliente", "3001112222", "Calle 1", null,
                List.of(new OrderItemRequest(1L, "Hamburguesa", new BigDecimal("18000"), 1, null)));

        ResponseEntity<OrderDto> response = rest.exchange(
                "/api/orders", HttpMethod.POST,
                new HttpEntity<>(request, bearer()), OrderDto.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ArgumentCaptor<OrderDto> captor = ArgumentCaptor.forClass(OrderDto.class);
        verify(eventsPublisher).publish(eq(OrderEventsPublisher.CREATED), captor.capture());
        assertThat(captor.getValue().type()).isEqualTo(com.combatti.orders.domain.OrderType.DELIVERY);
    }
}
