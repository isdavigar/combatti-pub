package com.combatti.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class GatewayApplicationTests {

    @Test
    void contextLoads() {
        // Verifica que el contexto del gateway (incluido el JwtService y el
        // filtro global) arranca correctamente con la configuración por defecto.
    }
}
