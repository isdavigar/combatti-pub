package com.combatti.integration.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * API key de integración. Solo se almacena el prefijo (público, para
 * búsqueda) y el hash del secreto. El secreto completo se muestra una única
 * vez al crear la key.
 */
@Entity
@Table(name = "api_key")
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    /** Prefijo público de la key (parte antes del punto), usado para búsqueda. */
    @Column(name = "key_prefix", nullable = false, unique = true, length = 32)
    private String keyPrefix;

    /** Hash BCrypt del secreto (parte después del punto). */
    @Column(name = "secret_hash", nullable = false, length = 100)
    private String secretHash;

    /** Scopes concedidos, separados por coma. */
    @Column(name = "scopes", nullable = false, length = 300)
    private String scopes = "";

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_by", length = 120)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    protected ApiKey() {
    }

    public ApiKey(String tenantId, String name, String keyPrefix, String secretHash,
                  Set<String> scopes, String createdBy) {
        this.tenantId = tenantId;
        this.name = name;
        this.keyPrefix = keyPrefix;
        this.secretHash = secretHash;
        setScopes(scopes);
        this.createdBy = createdBy;
        this.createdAt = Instant.now();
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getName() {
        return name;
    }

    public String getKeyPrefix() {
        return keyPrefix;
    }

    public String getSecretHash() {
        return secretHash;
    }

    public Set<String> getScopes() {
        if (scopes == null || scopes.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(scopes.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    public void setScopes(Set<String> scopes) {
        if (scopes == null || scopes.isEmpty()) {
            this.scopes = "";
        } else {
            this.scopes = scopes.stream().map(String::trim).collect(Collectors.joining(","));
        }
    }

    public boolean hasScope(String scope) {
        return getScopes().contains(scope);
    }

    public boolean isActive() {
        return active;
    }

    public void revoke() {
        this.active = false;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastUsedAt() {
        return lastUsedAt;
    }

    public void markUsed() {
        this.lastUsedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ApiKey apiKey)) {
            return false;
        }
        return id != null && id.equals(apiKey.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
