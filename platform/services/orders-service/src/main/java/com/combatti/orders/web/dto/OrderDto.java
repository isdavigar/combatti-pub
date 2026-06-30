package com.combatti.orders.web.dto;

import com.combatti.orders.domain.OrderChannel;
import com.combatti.orders.domain.OrderStatus;
import com.combatti.orders.domain.OrderType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDto(
        Long id,
        OrderType type,
        OrderChannel channel,
        OrderStatus status,
        Long tableId,
        String tableName,
        String customerName,
        String customerPhone,
        String customerAddress,
        String notes,
        BigDecimal subtotal,
        Instant createdAt,
        Instant updatedAt,
        List<OrderItemDto> items
) {
}
