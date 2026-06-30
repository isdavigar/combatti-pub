package com.combatti.auth.web.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Petición de inicio de sesión. {@code tenantId} es opcional (por defecto
 * "default") para soportar el modelo multi-tenant.
 */
public record LoginRequest(
        @NotBlank(message = "El usuario es obligatorio") String username,
        @NotBlank(message = "La contraseña es obligatoria") String password,
        String tenantId
) {
}
