package com.combatti.reporting.web.dto;

import java.math.BigDecimal;

public record TopProductDto(
        String productName,
        long quantity,
        BigDecimal revenue
) {
}
