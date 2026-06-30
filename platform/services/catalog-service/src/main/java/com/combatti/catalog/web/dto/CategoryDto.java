package com.combatti.catalog.web.dto;

public record CategoryDto(
        Long id,
        String name,
        int displayOrder,
        boolean active
) {
}
