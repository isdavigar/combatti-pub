package com.combatti.orders.web.dto;

public record TableDto(
        Long id,
        String name,
        String kind,
        String icon,
        int posX,
        int posY,
        int size,
        int sortOrder,
        boolean active,
        boolean occupied
) {
}
