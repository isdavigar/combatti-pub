package com.combatti.integration.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Pedido entrante desde un canal externo (e-commerce). Se traduce a un
 * pedido del orders-service con canal LOCAL y tipo configurable.
 */
public record ExternalOrderRequest(
        @Size(max = 16) String type,
        @Size(max = 120) String customerName,
        @Size(max = 40) String customerPhone,
        @Size(max = 240) String customerAddress,
        @Size(max = 300) String notes,
        @NotEmpty(message = "El pedido debe tener al menos un producto")
        @Valid List<ExternalOrderItem> items
) {
}
