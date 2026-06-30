package com.combatti.payments.web.dto;

import com.combatti.payments.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PaymentSplitRequest(
        @NotNull(message = "El método es obligatorio") PaymentMethod method,
        @NotNull(message = "El monto es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false, message = "El monto debe ser mayor que cero")
        BigDecimal amount
) {
}
