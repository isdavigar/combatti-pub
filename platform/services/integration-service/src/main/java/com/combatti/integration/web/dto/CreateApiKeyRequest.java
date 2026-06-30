package com.combatti.integration.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateApiKeyRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120)
        String name,

        @NotEmpty(message = "Debes conceder al menos un scope")
        Set<String> scopes
) {
}
