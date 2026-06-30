package com.combatti.integration.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        String description = """
                API pública de integración para conectar software externo, e-commerce y pasarelas.

                **Dos modos de autenticación:**
                - `bearerAuth` (JWT): para la gestión de API keys en `/api/integration/keys` (requiere el permiso `integrations.manage`).
                - `apiKey` (header `X-Api-Key`): para la API pública `/api/integration/v1/**`. El valor tiene el formato `prefijo.secreto` y se obtiene al crear una key. Cada endpoint exige un scope: `catalog:read`, `orders:read` u `orders:write`.
                """;
        return new OpenAPI()
                .info(new Info()
                        .title("Combatti — Integration API")
                        .version("1.0")
                        .description(description))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT"))
                        .addSecuritySchemes("apiKey", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-Api-Key")));
    }
}
