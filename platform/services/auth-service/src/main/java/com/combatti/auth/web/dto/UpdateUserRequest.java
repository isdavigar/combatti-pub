package com.combatti.auth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateUserRequest(
        @NotBlank(message = "El nombre es obligatorio") String displayName,
        @NotEmpty(message = "Debe asignar al menos un rol") List<String> roles,
        Boolean enabled
) {
}
