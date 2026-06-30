package com.combatti.integration.client;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.integration.service.BadRequestException;
import com.combatti.integration.service.NotFoundException;
import com.combatti.integration.web.dto.ExternalOrderItem;
import com.combatti.integration.web.dto.ExternalOrderRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Llama al orders-service server-to-server acuñando un JWT de servicio
 * (firmado con el secreto compartido) con el permiso {@code pos.orders}.
 */
@Component
public class RestClientOrdersGateway implements OrdersGateway {

    private static final Set<String> ALLOWED_TYPES = Set.of("DINE_IN", "DELIVERY", "TAKEAWAY");

    private final RestClient restClient;
    private final JwtService jwtService;

    public RestClientOrdersGateway(
            @Value("${combatti.orders.base-url:http://localhost:8083}") String baseUrl,
            JwtService jwtService) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.jwtService = jwtService;
    }

    @Override
    public OrderView createOrder(String tenantId, ExternalOrderRequest request) {
        Map<String, Object> payload = toOrdersPayload(request);
        try {
            return restClient.post()
                    .uri("/api/orders")
                    .header("Authorization", "Bearer " + serviceToken(tenantId))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(OrderView.class);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 400) {
                throw new BadRequestException("El orders-service rechazó el pedido: " + ex.getResponseBodyAsString());
            }
            throw ex;
        }
    }

    @Override
    public OrderView getOrder(String tenantId, Long orderId) {
        try {
            return restClient.get()
                    .uri("/api/orders/{id}", orderId)
                    .header("Authorization", "Bearer " + serviceToken(tenantId))
                    .retrieve()
                    .body(OrderView.class);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 404) {
                throw new NotFoundException("Pedido no encontrado: " + orderId);
            }
            throw ex;
        }
    }

    private Map<String, Object> toOrdersPayload(ExternalOrderRequest request) {
        String type = (request.type() == null || request.type().isBlank())
                ? "DELIVERY" : request.type().trim().toUpperCase();
        if (!ALLOWED_TYPES.contains(type)) {
            throw new BadRequestException("Tipo de pedido inválido: usa DINE_IN, DELIVERY o TAKEAWAY.");
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (ExternalOrderItem item : request.items()) {
            Map<String, Object> i = new LinkedHashMap<>();
            i.put("productId", item.productId());
            i.put("productName", item.productName());
            i.put("unitPrice", item.unitPrice());
            i.put("quantity", item.quantity());
            i.put("notes", item.notes());
            items.add(i);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        payload.put("channel", "LOCAL");
        payload.put("customerName", request.customerName());
        payload.put("customerPhone", request.customerPhone());
        payload.put("customerAddress", request.customerAddress());
        payload.put("notes", request.notes());
        payload.put("items", items);
        return payload;
    }

    private String serviceToken(String tenantId) {
        AuthenticatedUser serviceUser = new AuthenticatedUser(
                null, "integration-service", "Integration Service", tenantId,
                List.of(), List.of("pos.orders"));
        return jwtService.generateToken(serviceUser);
    }
}
