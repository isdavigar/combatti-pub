package com.combatti.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;

/**
 * Servicio de emisión y validación de tokens JWT (HMAC-SHA256).
 *
 * <p>Es una clase pura de Java (sin dependencias de Spring) para poder ser
 * reutilizada por cualquier microservicio. La configuración (secreto,
 * expiración, emisor) se inyecta por constructor.</p>
 */
public class JwtService {

    private final SecretKey key;
    private final long expirationSeconds;
    private final String issuer;

    /**
     * @param secret            secreto compartido; debe tener al menos 32 bytes
     *                          (256 bits) para HS256.
     * @param expirationSeconds vigencia del token de acceso, en segundos.
     * @param issuer            emisor (claim {@code iss}).
     */
    public JwtService(String secret, long expirationSeconds, String issuer) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalArgumentException(
                    "El secreto JWT debe tener al menos 32 bytes (256 bits) para HS256");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationSeconds = expirationSeconds;
        this.issuer = issuer;
    }

    /**
     * Genera un token de acceso firmado para el usuario indicado.
     */
    public String generateToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(expirationSeconds);

        return Jwts.builder()
                .issuer(issuer)
                .subject(user.username())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .claim(JwtClaims.USER_ID, user.userId())
                .claim(JwtClaims.TENANT_ID, user.tenantId())
                .claim(JwtClaims.NAME, user.displayName())
                .claim(JwtClaims.ROLES, user.roles())
                .claim(JwtClaims.PERMISSIONS, user.permissions())
                .signWith(key)
                .compact();
    }

    /**
     * Valida la firma y la vigencia del token, devolviendo el usuario.
     *
     * @throws JwtException si el token es inválido, está expirado o manipulado.
     */
    public AuthenticatedUser parseToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Long userId = claims.get(JwtClaims.USER_ID, Number.class) == null
                ? null
                : claims.get(JwtClaims.USER_ID, Number.class).longValue();

        return new AuthenticatedUser(
                userId,
                claims.getSubject(),
                claims.get(JwtClaims.NAME, String.class),
                claims.get(JwtClaims.TENANT_ID, String.class),
                toStringList(claims.get(JwtClaims.ROLES, List.class)),
                toStringList(claims.get(JwtClaims.PERMISSIONS, List.class))
        );
    }

    /**
     * Valida el token y devuelve {@code true} si es válido, sin lanzar excepción.
     */
    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    private static List<String> toStringList(Collection<?> raw) {
        List<String> result = new ArrayList<>();
        if (raw != null) {
            for (Object item : raw) {
                if (item != null) {
                    result.add(item.toString());
                }
            }
        }
        return List.copyOf(result);
    }
}
