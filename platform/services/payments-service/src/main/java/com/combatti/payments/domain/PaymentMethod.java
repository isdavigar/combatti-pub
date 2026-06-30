package com.combatti.payments.domain;

/** Métodos de pago soportados. */
public enum PaymentMethod {
    CASH,         // efectivo
    NEQUI,
    BANCOLOMBIA,
    BOLD,
    BREB,         // Llave / Bre-B
    MIXED         // pago mixto (ver splits)
}
