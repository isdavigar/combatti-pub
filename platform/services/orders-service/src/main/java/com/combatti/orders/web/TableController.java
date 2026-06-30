package com.combatti.orders.web;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.orders.service.TableService;
import com.combatti.orders.web.dto.TableDto;
import com.combatti.orders.web.dto.TableRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('pos.tables','pos.orders')")
    public List<TableDto> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return tableService.listTables(TenantSupport.tenantOf(user));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('pos.tables')")
    public ResponseEntity<TableDto> create(@AuthenticationPrincipal AuthenticatedUser user,
                                           @Valid @RequestBody TableRequest request) {
        TableDto created = tableService.createTable(TenantSupport.tenantOf(user), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('pos.tables')")
    public TableDto update(@AuthenticationPrincipal AuthenticatedUser user,
                           @PathVariable Long id,
                           @Valid @RequestBody TableRequest request) {
        return tableService.updateTable(TenantSupport.tenantOf(user), id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('pos.tables')")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user,
                                       @PathVariable Long id) {
        tableService.deleteTable(TenantSupport.tenantOf(user), id);
        return ResponseEntity.noContent().build();
    }
}
