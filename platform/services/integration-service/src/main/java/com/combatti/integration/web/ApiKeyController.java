package com.combatti.integration.web;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.integration.domain.ApiScope;
import com.combatti.integration.service.ApiKeyService;
import com.combatti.integration.web.dto.ApiKeyDto;
import com.combatti.integration.web.dto.CreateApiKeyRequest;
import com.combatti.integration.web.dto.CreatedApiKeyDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

/**
 * Gestión de API keys. Protegido con JWT + permiso {@code integrations.manage}.
 */
@RestController
@RequestMapping("/api/integration/keys")
@PreAuthorize("hasAuthority('integrations.manage')")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @GetMapping
    public List<ApiKeyDto> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return apiKeyService.list(TenantSupport.tenantOf(user));
    }

    /** Scopes disponibles para conceder a una key. */
    @GetMapping("/scopes")
    public Set<String> scopes() {
        return ApiScope.all();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreatedApiKeyDto create(@AuthenticationPrincipal AuthenticatedUser user,
                                   @Valid @RequestBody CreateApiKeyRequest request) {
        return apiKeyService.create(
                TenantSupport.tenantOf(user), TenantSupport.usernameOf(user), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable Long id) {
        apiKeyService.revoke(TenantSupport.tenantOf(user), id);
    }
}
