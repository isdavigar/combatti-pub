package com.combatti.cash.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CloseCashRequest(
        @NotNull(message = "El efectivo contado es obligatorio")
        @DecimalMin(value = "0.0", message = "El efectivo contado no puede ser negativo")
        BigDecimal countedCash,
        String notes
) {
}
