package com.combatti.orders.domain;

/** Estado del pedido (flujo de cocina y cobro). */
public enum OrderStatus {
    PENDING,    // pendiente (recién creado)
    PREPARING,  // en preparación (cocina)
    SENT,       // enviado / listo
    DELIVERED,  // entregado
    PAID,       // cobrado
    CANCELLED   // cancelado
}
