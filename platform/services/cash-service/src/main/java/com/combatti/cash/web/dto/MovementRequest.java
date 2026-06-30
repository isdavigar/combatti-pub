package com.combatti.cash.web.dto;

import com.combatti.cash.domain.MovementType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MovementRequest(
        @NotNull(message = "El tipo es obligatorio") MovementType type,
        @NotNull(message = "El monto es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false, message = "El monto debe ser mayor que cero")
        BigDecimal amount,
        String concept
) {
}
