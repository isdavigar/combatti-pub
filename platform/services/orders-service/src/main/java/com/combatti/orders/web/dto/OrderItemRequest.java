package com.combatti.orders.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OrderItemRequest(
        Long productId,
        @NotBlank(message = "El nombre del producto es obligatorio") String productName,
        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
        BigDecimal unitPrice,
        @Min(value = 1, message = "La cantidad debe ser al menos 1") int quantity,
        String notes
) {
}
