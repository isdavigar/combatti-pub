package com.combatti.cash.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record OpenCashRequest(
        @NotNull(message = "El fondo de apertura es obligatorio")
        @DecimalMin(value = "0.0", message = "El fondo no puede ser negativo")
        BigDecimal openingAmount,
        String notes
) {
}
