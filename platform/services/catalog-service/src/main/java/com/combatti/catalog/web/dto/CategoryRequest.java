package com.combatti.catalog.web.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Petición de creación/actualización de categoría. {@code displayOrder} y
 * {@code active} son opcionales (se aplican valores por defecto si vienen null).
 */
public record CategoryRequest(
        @NotBlank(message = "El nombre es obligatorio") String name,
        Integer displayOrder,
        Boolean active
) {
}
