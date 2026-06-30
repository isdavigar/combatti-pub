package com.combatti.common.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRET = "0123456789-0123456789-0123456789-abc"; // >= 32 bytes
    private static final String ISSUER = "combatti-auth";

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    private AuthenticatedUser sampleUser() {
        return new AuthenticatedUser(
                1L,
                "admin",
                "Administrador",
                "default",
                List.of("Administrador"),
                List.of("pos.read", "pos.write")
        );
    }

    @Test
    void generatesAndParsesTokenPreservingClaims() {
        String token = jwtService.generateToken(sampleUser());
        AuthenticatedUser parsed = jwtService.parseToken(token);

        assertEquals(1L, parsed.userId());
        assertEquals("admin", parsed.username());
        assertEquals("Administrador", parsed.displayName());
        assertEquals("default", parsed.tenantId());
        assertEquals(List.of("Administrador"), parsed.roles());
        assertEquals(List.of("pos.read", "pos.write"), parsed.permissions());
    }

    @Test
    void validTokenIsReportedValid() {
        String token = jwtService.generateToken(sampleUser());
        assertTrue(jwtService.isValid(token));
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = jwtService.generateToken(sampleUser());
        String tampered = token.substring(0, token.length() - 2) + "xx";
        assertFalse(jwtService.isValid(tampered));
        assertThrows(JwtException.class, () -> jwtService.parseToken(tampered));
    }

    @Test
    void tokenSignedWithDifferentSecretIsRejected() {
        String token = jwtService.generateToken(sampleUser());
        JwtService other = new JwtService("zzzzzzzzzz-zzzzzzzzzz-zzzzzzzzzz-xyz", 3600, ISSUER);
        assertFalse(other.isValid(token));
    }

    @Test
    void shortSecretIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> new JwtService("too-short", 3600, ISSUER));
    }
}
