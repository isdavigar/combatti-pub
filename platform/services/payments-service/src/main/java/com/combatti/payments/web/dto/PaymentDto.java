package com.combatti.payments.web.dto;

import com.combatti.payments.domain.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PaymentDto(
        Long id,
        Long orderId,
        PaymentMethod method,
        BigDecimal amount,
        BigDecimal cashReceived,
        BigDecimal changeGiven,
        String notes,
        String createdBy,
        Instant createdAt,
        List<PaymentSplitDto> splits
) {
}
