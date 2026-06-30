package com.combatti.gateway.config;

import com.combatti.common.security.JwtService;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(GatewayJwtProperties.class)
public class GatewayConfig {

    @Bean
    public JwtService jwtService(GatewayJwtProperties properties) {
        return new JwtService(
                properties.getSecret(),
                properties.getExpirationSeconds(),
                properties.getIssuer()
        );
    }
}
