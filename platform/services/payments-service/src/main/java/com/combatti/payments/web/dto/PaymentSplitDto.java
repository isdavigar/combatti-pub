package com.combatti.payments.web.dto;

import com.combatti.payments.domain.PaymentMethod;

import java.math.BigDecimal;

public record PaymentSplitDto(
        PaymentMethod method,
        BigDecimal amount
) {
}
