package com.combatti.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de configuración del JWT, mapeadas desde {@code combatti.jwt.*}.
 */
@ConfigurationProperties(prefix = "combatti.jwt")
public class JwtProperties {

    /** Secreto HMAC (>= 32 bytes). */
    private String secret;

    /** Vigencia del token de acceso, en segundos. */
    private long expirationSeconds = 86400;

    /** Emisor del token (claim iss). */
    private String issuer = "combatti-auth";

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public void setExpirationSeconds(long expirationSeconds) {
        this.expirationSeconds = expirationSeconds;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }
}
