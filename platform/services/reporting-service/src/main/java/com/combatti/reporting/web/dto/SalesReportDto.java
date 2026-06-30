package com.combatti.reporting.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SalesReportDto(
        LocalDate from,
        LocalDate to,
        BigDecimal total,
        long transactions,
        BigDecimal averageTicket,
        List<MethodTotalDto> byMethod
) {
}
