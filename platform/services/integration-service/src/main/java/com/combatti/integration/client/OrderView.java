package com.combatti.integration.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Vista de pedido devuelta por la API pública (subconjunto del orders-service). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OrderView(
        Long id,
        String type,
        String channel,
        String status,
        String customerName,
        String customerPhone,
        String customerAddress,
        String notes,
        BigDecimal subtotal,
        Instant createdAt,
        List<Item> items
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            Long productId,
            String productName,
            BigDecimal unitPrice,
            Integer quantity,
            String notes
    ) {
    }
}
