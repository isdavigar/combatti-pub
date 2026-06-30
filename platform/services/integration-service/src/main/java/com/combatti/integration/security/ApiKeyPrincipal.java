package com.combatti.integration.security;

/** Identidad asociada a una API key autenticada en la API pública. */
public record ApiKeyPrincipal(Long keyId, String tenantId, String name) {
}
