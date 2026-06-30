package com.combatti.reporting.web.dto;

import java.math.BigDecimal;

public record MethodTotalDto(
        String method,
        BigDecimal total,
        long count
) {
}
