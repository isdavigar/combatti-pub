package com.combatti.integration.config;

import com.combatti.common.security.JwtService;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {

    @Bean
    public JwtService jwtService(JwtProperties properties) {
        return new JwtService(
                properties.getSecret(),
                properties.getExpirationSeconds(),
                properties.getIssuer()
        );
    }
}
