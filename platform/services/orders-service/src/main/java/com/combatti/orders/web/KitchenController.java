package com.combatti.orders.web;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.orders.service.OrderService;
import com.combatti.orders.web.dto.OrderDto;
import com.combatti.orders.web.dto.UpdateStatusRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Vista de cocina (KDS): pedidos pendientes/en preparación/listos.
 */
@RestController
@RequestMapping("/api/orders/kitchen")
public class KitchenController {

    private final OrderService orderService;

    public KitchenController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('pos.kitchen')")
    public List<OrderDto> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return orderService.listKitchenOrders(TenantSupport.tenantOf(user));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('pos.kitchen')")
    public OrderDto updateStatus(@AuthenticationPrincipal AuthenticatedUser user,
                                 @PathVariable Long id,
                                 @Valid @RequestBody UpdateStatusRequest request) {
        return orderService.updateStatus(TenantSupport.tenantOf(user), id, request.status());
    }
}
