package com.combatti.common.security;

import java.util.List;

/**
 * Representación inmutable del usuario autenticado extraída de un JWT válido.
 */
public record AuthenticatedUser(
        Long userId,
        String username,
        String displayName,
        String tenantId,
        List<String> roles,
        List<String> permissions
) {
}
