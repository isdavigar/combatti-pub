package com.combatti.orders.web.dto;

import com.combatti.orders.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull(message = "El estado es obligatorio") OrderStatus status
) {
}
