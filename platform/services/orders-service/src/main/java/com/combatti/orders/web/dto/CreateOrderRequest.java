package com.combatti.orders.web.dto;

import com.combatti.orders.domain.OrderChannel;
import com.combatti.orders.domain.OrderType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(
        @NotNull(message = "El tipo de pedido es obligatorio") OrderType type,
        OrderChannel channel,
        Long tableId,
        String customerName,
        String customerPhone,
        String customerAddress,
        String notes,
        @NotEmpty(message = "El pedido debe tener al menos un producto")
        @Valid List<OrderItemRequest> items
) {
}
