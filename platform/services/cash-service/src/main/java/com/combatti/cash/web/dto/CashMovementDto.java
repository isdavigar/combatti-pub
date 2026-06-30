package com.combatti.cash.web.dto;

import com.combatti.cash.domain.MovementType;

import java.math.BigDecimal;
import java.time.Instant;

public record CashMovementDto(
        Long id,
        MovementType type,
        BigDecimal amount,
        String concept,
        String createdBy,
        Instant createdAt
) {
}
