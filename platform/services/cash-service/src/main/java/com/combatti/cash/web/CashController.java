package com.combatti.cash.web;

import com.combatti.cash.service.CashService;
import com.combatti.cash.web.dto.CashSessionDto;
import com.combatti.cash.web.dto.CloseCashRequest;
import com.combatti.cash.web.dto.MovementRequest;
import com.combatti.cash.web.dto.OpenCashRequest;
import com.combatti.common.security.AuthenticatedUser;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cash")
@PreAuthorize("hasAuthority('pos.cash')")
public class CashController {

    private final CashService cashService;

    public CashController(CashService cashService) {
        this.cashService = cashService;
    }

    @GetMapping("/current")
    public ResponseEntity<CashSessionDto> current(@AuthenticationPrincipal AuthenticatedUser user) {
        return cashService.getCurrentSession(TenantSupport.tenantOf(user))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/open")
    public ResponseEntity<CashSessionDto> open(@AuthenticationPrincipal AuthenticatedUser user,
                                               @Valid @RequestBody OpenCashRequest request) {
        CashSessionDto session = cashService.openCash(
                TenantSupport.tenantOf(user), TenantSupport.usernameOf(user), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PostMapping("/close")
    public CashSessionDto close(@AuthenticationPrincipal AuthenticatedUser user,
                                @Valid @RequestBody CloseCashRequest request) {
        return cashService.closeCash(
                TenantSupport.tenantOf(user), TenantSupport.usernameOf(user), request);
    }

    @PostMapping("/movements")
    public ResponseEntity<CashSessionDto> addMovement(@AuthenticationPrincipal AuthenticatedUser user,
                                                      @Valid @RequestBody MovementRequest request) {
        CashSessionDto session = cashService.addMovement(
                TenantSupport.tenantOf(user), TenantSupport.usernameOf(user), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @GetMapping("/sessions")
    public List<CashSessionDto> sessions(@AuthenticationPrincipal AuthenticatedUser user) {
        return cashService.listSessions(TenantSupport.tenantOf(user));
    }

    @GetMapping("/sessions/{id}")
    public CashSessionDto session(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        return cashService.getSession(TenantSupport.tenantOf(user), id);
    }
}
