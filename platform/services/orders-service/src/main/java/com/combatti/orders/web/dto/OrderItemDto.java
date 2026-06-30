package com.combatti.orders.web.dto;

import java.math.BigDecimal;

public record OrderItemDto(
        Long id,
        Long productId,
        String productName,
        BigDecimal unitPrice,
        int quantity,
        String notes,
        BigDecimal lineTotal
) {
}
