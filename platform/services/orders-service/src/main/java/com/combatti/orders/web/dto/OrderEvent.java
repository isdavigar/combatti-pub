package com.combatti.orders.web.dto;

/**
 * Evento de tiempo real emitido a /topic/orders cuando un pedido cambia.
 * type: ORDER_CREATED | ORDER_UPDATED | ORDER_CANCELLED.
 */
public record OrderEvent(
        String type,
        OrderDto order
) {
}
