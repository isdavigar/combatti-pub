package com.combatti.catalog.web.dto;

import java.math.BigDecimal;

public record ProductDto(
        Long id,
        String name,
        String description,
        BigDecimal price,
        boolean stockManaged,
        int minStock,
        boolean active,
        Long categoryId,
        String categoryName
) {
}
