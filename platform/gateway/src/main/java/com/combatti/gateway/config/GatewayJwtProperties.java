package com.combatti.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades JWT del gateway ({@code combatti.jwt.*}). Solo necesita validar
 * tokens, por lo que el secreto y el emisor deben coincidir con los del
 * auth-service.
 */
@ConfigurationProperties(prefix = "combatti.jwt")
public class GatewayJwtProperties {

    private String secret;
    private String issuer = "combatti-auth";
    private long expirationSeconds = 86400;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public void setExpirationSeconds(long expirationSeconds) {
        this.expirationSeconds = expirationSeconds;
    }
}
