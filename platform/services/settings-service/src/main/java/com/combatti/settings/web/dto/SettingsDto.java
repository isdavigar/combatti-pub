package com.combatti.settings.web.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record SettingsDto(
        String restaurantName,
        String taxId,
        String address,
        String phone,
        String email,
        String currency,
        BigDecimal taxRatePercent,
        BigDecimal serviceChargePercent,
        BigDecimal tipSuggestedPercent,
        String receiptFooter,
        String printerTransport,
        String receiptPrinterHost,
        Integer receiptPrinterPort,
        String kitchenPrinterHost,
        Integer kitchenPrinterPort,
        String updatedBy,
        Instant updatedAt
) {
}
