package com.combatti.payments.client;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.payments.service.NotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

/**
 * Implementación HTTP del {@link OrderClient}. Acuña un JWT de servicio
 * interno (firmado con el secreto compartido) con el permiso {@code pos.orders}
 * y el tenant del cobro, para autenticarse ante el orders-service.
 */
@Component
public class RestClientOrderClient implements OrderClient {

    private final RestClient restClient;
    private final JwtService jwtService;

    public RestClientOrderClient(
            @Value("${combatti.orders.base-url:http://localhost:8083}") String baseUrl,
            JwtService jwtService) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.jwtService = jwtService;
    }

    @Override
    public OrderSnapshot getOrder(String tenantId, Long orderId) {
        try {
            return restClient.get()
                    .uri("/api/orders/{id}", orderId)
                    .header("Authorization", "Bearer " + serviceToken(tenantId))
                    .retrieve()
                    .body(OrderSnapshot.class);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new NotFoundException("Pedido no encontrado: " + orderId);
            }
            throw ex;
        }
    }

    @Override
    public void markPaid(String tenantId, Long orderId) {
        restClient.patch()
                .uri("/api/orders/{id}/status", orderId)
                .header("Authorization", "Bearer " + serviceToken(tenantId))
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("status", "PAID"))
                .retrieve()
                .toBodilessEntity();
    }

    private String serviceToken(String tenantId) {
        AuthenticatedUser serviceUser = new AuthenticatedUser(
                null, "payments-service", "Payments Service", tenantId,
                List.of(), List.of("pos.orders"));
        return jwtService.generateToken(serviceUser);
    }
}
