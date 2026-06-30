package com.combatti.catalog.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Petición de creación/actualización de producto. Los campos opcionales
 * ({@code stockManaged}, {@code minStock}, {@code active}) toman valores por
 * defecto en el servicio si vienen null.
 */
public record ProductRequest(
        @NotBlank(message = "El nombre es obligatorio") String name,
        String description,
        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", message = "El precio no puede ser negativo")
        BigDecimal price,
        Boolean stockManaged,
        Integer minStock,
        Boolean active,
        @NotNull(message = "La categoría es obligatoria") Long categoryId
) {
}
