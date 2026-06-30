package com.combatti.integration.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/** Vista de producto expuesta por la API pública (subconjunto del catálogo). */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductView(
        Long id,
        String name,
        String description,
        BigDecimal price,
        boolean active,
        Long categoryId,
        String categoryName
) {
}
