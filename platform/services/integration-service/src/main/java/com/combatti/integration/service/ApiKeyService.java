package com.combatti.integration.service;

import com.combatti.integration.domain.ApiKey;
import com.combatti.integration.domain.ApiScope;
import com.combatti.integration.repository.ApiKeyRepository;
import com.combatti.integration.web.dto.ApiKeyDto;
import com.combatti.integration.web.dto.CreateApiKeyRequest;
import com.combatti.integration.web.dto.CreatedApiKeyDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ApiKeyService {

    private static final String PREFIX_LABEL = "cmbt";
    private static final int PREFIX_BYTES = 9;   // ~12 chars base64url
    private static final int SECRET_BYTES = 32;  // ~43 chars base64url

    private final ApiKeyRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();
    private final Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();

    public ApiKeyService(ApiKeyRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<ApiKeyDto> list(String tenantId) {
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CreatedApiKeyDto create(String tenantId, String createdBy, CreateApiKeyRequest request) {
        Set<String> scopes = validateScopes(request.scopes());

        String prefix = PREFIX_LABEL + "_" + randomToken(PREFIX_BYTES);
        // En la práctica improbable, pero garantizamos unicidad del prefijo.
        while (repository.findByKeyPrefix(prefix).isPresent()) {
            prefix = PREFIX_LABEL + "_" + randomToken(PREFIX_BYTES);
        }
        String secret = randomToken(SECRET_BYTES);

        ApiKey apiKey = new ApiKey(
                tenantId, request.name().trim(), prefix,
                passwordEncoder.encode(secret), scopes, createdBy);
        ApiKey saved = repository.save(apiKey);

        String fullKey = prefix + "." + secret;
        return new CreatedApiKeyDto(toDto(saved), fullKey);
    }

    @Transactional
    public void revoke(String tenantId, Long id) {
        ApiKey apiKey = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NotFoundException("API key no encontrada: " + id));
        apiKey.revoke();
        repository.save(apiKey);
    }

    /**
     * Autentica una API key cruda (formato {@code prefijo.secreto}).
     * Devuelve la entidad si es válida y está activa, o vacío en caso contrario.
     */
    @Transactional
    public Optional<ApiKey> authenticate(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) {
            return Optional.empty();
        }
        int dot = rawKey.indexOf('.');
        if (dot <= 0 || dot == rawKey.length() - 1) {
            return Optional.empty();
        }
        String prefix = rawKey.substring(0, dot);
        String secret = rawKey.substring(dot + 1);

        return repository.findByKeyPrefix(prefix)
                .filter(ApiKey::isActive)
                .filter(key -> passwordEncoder.matches(secret, key.getSecretHash()))
                .map(key -> {
                    key.markUsed();
                    return repository.save(key);
                });
    }

    private Set<String> validateScopes(Set<String> requested) {
        Set<String> result = new LinkedHashSet<>();
        for (String scope : requested) {
            String trimmed = scope == null ? "" : scope.trim();
            if (!ApiScope.isValid(trimmed)) {
                throw new BadRequestException("Scope inválido: '" + scope + "'. Válidos: " + ApiScope.all());
            }
            result.add(trimmed);
        }
        if (result.isEmpty()) {
            throw new BadRequestException("Debes conceder al menos un scope válido.");
        }
        return result;
    }

    private String randomToken(int numBytes) {
        byte[] bytes = new byte[numBytes];
        random.nextBytes(bytes);
        return encoder.encodeToString(bytes);
    }

    private ApiKeyDto toDto(ApiKey key) {
        return new ApiKeyDto(
                key.getId(),
                key.getName(),
                key.getKeyPrefix(),
                key.getScopes(),
                key.isActive(),
                key.getCreatedBy(),
                key.getCreatedAt(),
                key.getLastUsedAt());
    }
}
