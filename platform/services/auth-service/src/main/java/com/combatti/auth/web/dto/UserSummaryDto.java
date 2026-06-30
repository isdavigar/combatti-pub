package com.combatti.auth.web.dto;

import java.time.Instant;
import java.util.List;

/** Vista de usuario para administración (nunca incluye la contraseña). */
public record UserSummaryDto(
        Long id,
        String username,
        String displayName,
        String tenantId,
        List<String> roles,
        boolean enabled,
        Instant createdAt
) {
}
