package com.combatti.auth.web.dto;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        UserDto user
) {
}
