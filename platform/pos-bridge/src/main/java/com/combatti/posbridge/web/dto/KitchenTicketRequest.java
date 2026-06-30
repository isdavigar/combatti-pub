package com.combatti.posbridge.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record KitchenTicketRequest(
        Long orderId,
        String destination,
        @NotNull @NotEmpty List<KitchenItem> items,
        String notes
) {
}
