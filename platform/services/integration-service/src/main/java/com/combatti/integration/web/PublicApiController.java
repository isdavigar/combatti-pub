package com.combatti.integration.web;

import com.combatti.integration.client.CatalogGateway;
import com.combatti.integration.client.OrderView;
import com.combatti.integration.client.OrdersGateway;
import com.combatti.integration.client.ProductView;
import com.combatti.integration.security.ApiKeyPrincipal;
import com.combatti.integration.web.dto.ExternalOrderRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * API pública v1 para integraciones externas (e-commerce, pasarelas).
 * Autenticada con {@code X-Api-Key}; cada endpoint exige el scope adecuado.
 */
@RestController
@RequestMapping("/api/integration/v1")
public class PublicApiController {

    private final CatalogGateway catalogGateway;
    private final OrdersGateway ordersGateway;

    public PublicApiController(CatalogGateway catalogGateway, OrdersGateway ordersGateway) {
        this.catalogGateway = catalogGateway;
        this.ordersGateway = ordersGateway;
    }

    @GetMapping("/catalog")
    @PreAuthorize("hasAuthority('catalog:read')")
    public List<ProductView> catalog(@AuthenticationPrincipal ApiKeyPrincipal principal) {
        return catalogGateway.listProducts(principal.tenantId());
    }

    @PostMapping("/orders")
    @PreAuthorize("hasAuthority('orders:write')")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderView createOrder(@AuthenticationPrincipal ApiKeyPrincipal principal,
                                 @Valid @RequestBody ExternalOrderRequest request) {
        return ordersGateway.createOrder(principal.tenantId(), request);
    }

    @GetMapping("/orders/{id}")
    @PreAuthorize("hasAuthority('orders:read')")
    public OrderView getOrder(@AuthenticationPrincipal ApiKeyPrincipal principal,
                              @PathVariable Long id) {
        return ordersGateway.getOrder(principal.tenantId(), id);
    }
}
