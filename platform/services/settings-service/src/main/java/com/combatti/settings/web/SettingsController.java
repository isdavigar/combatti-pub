package com.combatti.settings.web;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.settings.service.SettingsService;
import com.combatti.settings.web.dto.SettingsDto;
import com.combatti.settings.web.dto.UpdateSettingsRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    /** Lectura: cualquier usuario autenticado (nombre del negocio, moneda, pie de recibo...). */
    @GetMapping
    public SettingsDto get(@AuthenticationPrincipal AuthenticatedUser user) {
        return settingsService.getOrCreate(TenantSupport.tenantOf(user));
    }

    /** Escritura: solo con el permiso settings.manage. */
    @PutMapping
    @PreAuthorize("hasAuthority('settings.manage')")
    public SettingsDto update(@AuthenticationPrincipal AuthenticatedUser user,
                              @Valid @RequestBody UpdateSettingsRequest request) {
        return settingsService.update(
                TenantSupport.tenantOf(user), TenantSupport.usernameOf(user), request);
    }
}
