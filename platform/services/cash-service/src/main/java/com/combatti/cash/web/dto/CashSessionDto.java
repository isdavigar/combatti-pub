package com.combatti.cash.web.dto;

import com.combatti.cash.domain.CashSessionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CashSessionDto(
        Long id,
        CashSessionStatus status,
        BigDecimal openingAmount,
        String openedBy,
        Instant openedAt,
        String closedBy,
        Instant closedAt,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        // Saldo esperado en caja en este momento (fondo + ingresos - egresos).
        BigDecimal balance,
        // Valores registrados al cierre (null mientras está abierta).
        BigDecimal expectedCash,
        BigDecimal countedCash,
        BigDecimal difference,
        String notes,
        List<CashMovementDto> movements
) {
}
