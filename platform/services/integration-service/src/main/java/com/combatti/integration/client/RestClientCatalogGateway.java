package com.combatti.integration.client;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Llama al catalog-service server-to-server acuñando un JWT de servicio
 * (firmado con el secreto compartido) con el permiso {@code catalog.read}.
 */
@Component
public class RestClientCatalogGateway implements CatalogGateway {

    private final RestClient restClient;
    private final JwtService jwtService;

    public RestClientCatalogGateway(
            @Value("${combatti.catalog.base-url:http://localhost:8082}") String baseUrl,
            JwtService jwtService) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.jwtService = jwtService;
    }

    @Override
    public List<ProductView> listProducts(String tenantId) {
        List<ProductView> products = restClient.get()
                .uri("/api/catalog/products")
                .header("Authorization", "Bearer " + serviceToken(tenantId))
                .retrieve()
                .body(new ParameterizedTypeReference<List<ProductView>>() {
                });
        return products != null ? products : List.of();
    }

    private String serviceToken(String tenantId) {
        AuthenticatedUser serviceUser = new AuthenticatedUser(
                null, "integration-service", "Integration Service", tenantId,
                List.of(), List.of("catalog.read"));
        return jwtService.generateToken(serviceUser);
    }
}
