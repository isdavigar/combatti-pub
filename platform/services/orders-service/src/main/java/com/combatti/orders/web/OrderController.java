package com.combatti.orders.web;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.orders.service.OrderService;
import com.combatti.orders.web.dto.CreateOrderRequest;
import com.combatti.orders.web.dto.OrderDto;
import com.combatti.orders.web.dto.UpdateStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('pos.orders')")
    public List<OrderDto> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return orderService.listOrders(TenantSupport.tenantOf(user));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('pos.orders')")
    public OrderDto get(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return orderService.getOrder(TenantSupport.tenantOf(user), id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('pos.orders')")
    public ResponseEntity<OrderDto> create(@AuthenticationPrincipal AuthenticatedUser user,
                                           @Valid @RequestBody CreateOrderRequest request) {
        OrderDto created = orderService.createOrder(TenantSupport.tenantOf(user), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('pos.orders')")
    public OrderDto updateStatus(@AuthenticationPrincipal AuthenticatedUser user,
                                 @PathVariable Long id,
                                 @Valid @RequestBody UpdateStatusRequest request) {
        return orderService.updateStatus(TenantSupport.tenantOf(user), id, request.status());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('pos.orders')")
    public OrderDto cancel(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return orderService.cancelOrder(TenantSupport.tenantOf(user), id);
    }
}
