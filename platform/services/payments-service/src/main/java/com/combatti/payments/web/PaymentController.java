package com.combatti.payments.web;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.payments.service.PaymentService;
import com.combatti.payments.web.dto.CreatePaymentRequest;
import com.combatti.payments.web.dto.PaymentDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('pos.cash')")
    public List<PaymentDto> list(@AuthenticationPrincipal AuthenticatedUser user,
                                 @RequestParam(value = "orderId", required = false) Long orderId) {
        return paymentService.listPayments(TenantSupport.tenantOf(user), orderId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('pos.cash')")
    public PaymentDto get(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return paymentService.getPayment(TenantSupport.tenantOf(user), id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('pos.cash')")
    public ResponseEntity<PaymentDto> create(@AuthenticationPrincipal AuthenticatedUser user,
                                             @Valid @RequestBody CreatePaymentRequest request) {
        String createdBy = user != null ? user.username() : null;
        PaymentDto created = paymentService.createPayment(TenantSupport.tenantOf(user), createdBy, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
