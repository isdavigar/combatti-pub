package com.combatti.posbridge.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record ReceiptRequest(
        Long orderId,
        @NotNull List<ReceiptLine> items,
        BigDecimal total,
        String paymentMethod,
        BigDecimal cashReceived,
        BigDecimal changeGiven,
        boolean openDrawer
) {
}
