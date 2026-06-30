package com.combatti.catalog;

import com.combatti.catalog.web.dto.CategoryDto;
import com.combatti.catalog.web.dto.ProductDto;
import com.combatti.catalog.web.dto.ProductRequest;
import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test de integración del catalog-service con PostgreSQL real (Testcontainers).
 * Genera un JWT válido con el mismo secreto/emisor por defecto de la app.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class CatalogIntegrationTest {

    private static final String SECRET = "dev-secret-change-me-please-change-me-32";
    private static final String ISSUER = "combatti-auth";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    private String tokenWithPermissions(List<String> permissions) {
        AuthenticatedUser user = new AuthenticatedUser(
                1L, "admin", "Administrador", "default", List.of("Administrador"), permissions);
        return jwtService.generateToken(user);
    }

    private HttpHeaders bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    @Test
    void listsSeededCategories() {
        HttpHeaders headers = bearer(tokenWithPermissions(List.of("catalog.read")));

        ResponseEntity<CategoryDto[]> response = rest.exchange(
                "/api/catalog/categories", HttpMethod.GET, new HttpEntity<>(headers), CategoryDto[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).hasSize(22);
    }

    @Test
    void listsSeededProducts() {
        HttpHeaders headers = bearer(tokenWithPermissions(List.of("catalog.read")));

        ResponseEntity<ProductDto[]> response = rest.exchange(
                "/api/catalog/products", HttpMethod.GET, new HttpEntity<>(headers), ProductDto[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().length).isGreaterThanOrEqualTo(147);
        assertThat(response.getBody()[0].categoryName()).isNotBlank();
    }

    @Test
    void rejectsRequestWithoutToken() {
        ResponseEntity<String> response = rest.getForEntity("/api/catalog/categories", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejectsReadWithoutCatalogPermission() {
        HttpHeaders headers = bearer(tokenWithPermissions(List.of("reports.read")));

        ResponseEntity<String> response = rest.exchange(
                "/api/catalog/categories", HttpMethod.GET, new HttpEntity<>(headers), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void createsProductWithWritePermission() {
        // Tomamos una categoría existente.
        HttpHeaders readHeaders = bearer(tokenWithPermissions(List.of("catalog.read")));
        CategoryDto[] categories = rest.exchange(
                "/api/catalog/categories", HttpMethod.GET, new HttpEntity<>(readHeaders), CategoryDto[].class)
                .getBody();
        assertThat(categories).isNotNull();
        Long categoryId = categories[0].id();

        ProductRequest request = new ProductRequest(
                "Producto de prueba", "Descripción de prueba",
                new BigDecimal("12345.00"), false, 0, true, categoryId);

        HttpHeaders writeHeaders = bearer(tokenWithPermissions(List.of("catalog.read", "catalog.write")));
        ResponseEntity<ProductDto> response = rest.exchange(
                "/api/catalog/products", HttpMethod.POST, new HttpEntity<>(request, writeHeaders), ProductDto.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isNotNull();
        assertThat(response.getBody().name()).isEqualTo("Producto de prueba");
        assertThat(response.getBody().categoryId()).isEqualTo(categoryId);
    }

    @Test
    void rejectsCreateWithoutWritePermission() {
        ProductRequest request = new ProductRequest(
                "No permitido", null, new BigDecimal("1000"), false, 0, true, 1L);

        HttpHeaders headers = bearer(tokenWithPermissions(List.of("catalog.read")));
        ResponseEntity<String> response = rest.exchange(
                "/api/catalog/products", HttpMethod.POST, new HttpEntity<>(request, headers), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
