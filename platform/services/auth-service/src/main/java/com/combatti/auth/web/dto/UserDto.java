package com.combatti.auth.web.dto;

import java.util.List;

public record UserDto(
        Long id,
        String username,
        String displayName,
        String tenantId,
        List<String> roles,
        List<String> permissions
) {
}
