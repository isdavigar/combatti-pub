package com.combatti.reporting.web.dto;

import java.math.BigDecimal;

public record CategorySalesDto(
        String category,
        long quantity,
        BigDecimal revenue
) {
}
