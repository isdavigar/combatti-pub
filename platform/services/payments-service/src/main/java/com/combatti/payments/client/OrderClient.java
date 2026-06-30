package com.combatti.payments.client;

/**
 * Cliente del orders-service para validar y actualizar el pedido al cobrar.
 */
public interface OrderClient {

    /**
     * Obtiene el pedido. Lanza {@link com.combatti.payments.service.NotFoundException}
     * si no existe.
     */
    OrderSnapshot getOrder(String tenantId, Long orderId);

    /** Marca el pedido como pagado (PAID). */
    void markPaid(String tenantId, Long orderId);
}
