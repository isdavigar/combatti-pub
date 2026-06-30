package com.combatti.posbridge.web.dto;

import java.math.BigDecimal;

public record ReceiptLine(
        String name,
        int quantity,
        BigDecimal lineTotal
) {
}
