package com.combatti.payments.web.dto;

import com.combatti.payments.domain.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreatePaymentRequest(
        @NotNull(message = "El pedido es obligatorio") Long orderId,
        @NotNull(message = "El método es obligatorio") PaymentMethod method,
        @NotNull(message = "El monto es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false, message = "El monto debe ser mayor que cero")
        BigDecimal amount,
        BigDecimal cashReceived,
        String notes,
        @Valid List<PaymentSplitRequest> splits
) {
}
