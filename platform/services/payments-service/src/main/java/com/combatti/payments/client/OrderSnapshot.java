package com.combatti.payments.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/**
 * Vista parcial de un pedido obtenida del orders-service (se ignoran los
 * campos no necesarios para el cobro).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OrderSnapshot(
        Long id,
        String status,
        BigDecimal subtotal
) {
}
