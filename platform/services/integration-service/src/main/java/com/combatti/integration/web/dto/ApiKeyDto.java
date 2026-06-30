package com.combatti.integration.web.dto;

import java.time.Instant;
import java.util.Set;

/** Representación pública de una API key (nunca incluye el secreto). */
public record ApiKeyDto(
        Long id,
        String name,
        String keyPrefix,
        Set<String> scopes,
        boolean active,
        String createdBy,
        Instant createdAt,
        Instant lastUsedAt
) {
}
