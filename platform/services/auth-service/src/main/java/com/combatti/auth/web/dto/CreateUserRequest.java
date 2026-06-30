package com.combatti.auth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateUserRequest(
        @NotBlank(message = "El usuario es obligatorio")
        @Size(min = 3, max = 80, message = "El usuario debe tener entre 3 y 80 caracteres")
        String username,
        @NotBlank(message = "El nombre es obligatorio") String displayName,
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, max = 100, message = "La contraseña debe tener al menos 6 caracteres")
        String password,
        @NotEmpty(message = "Debe asignar al menos un rol") List<String> roles,
        Boolean enabled
) {
}
