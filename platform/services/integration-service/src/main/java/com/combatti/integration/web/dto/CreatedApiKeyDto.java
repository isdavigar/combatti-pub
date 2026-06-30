package com.combatti.integration.web.dto;

/**
 * Respuesta al crear una API key. Incluye el secreto completo, que solo se
 * muestra UNA vez (no vuelve a estar disponible).
 */
public record CreatedApiKeyDto(
        ApiKeyDto key,
        String apiKey
) {
}
