package com.combatti.orders.web.dto;

import jakarta.validation.constraints.NotBlank;

public record TableRequest(
        @NotBlank(message = "El nombre es obligatorio") String name,
        String kind,
        String icon,
        Integer posX,
        Integer posY,
        Integer size,
        Integer sortOrder,
        Boolean active
) {
}
