package com.combatti.integration;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.integration.client.CatalogGateway;
import com.combatti.integration.client.OrderView;
import com.combatti.integration.client.OrdersGateway;
import com.combatti.integration.client.ProductView;
import com.combatti.integration.security.ApiKeyAuthenticationFilter;
import com.combatti.integration.web.dto.CreateApiKeyRequest;
import com.combatti.integration.web.dto.CreatedApiKeyDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class IntegrationApiTest {

    private static final String SECRET = "dev-secret-change-me-please-change-me-32";
    private static final String ISSUER = "combatti-auth";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    @MockBean
    private CatalogGateway catalogGateway;

    @MockBean
    private OrdersGateway ordersGateway;

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    @BeforeEach
    void resetMocks() {
        Mockito.reset(catalogGateway, ordersGateway);
    }

    private HttpHeaders jwt(List<String> permissions) {
        AuthenticatedUser user = new AuthenticatedUser(
                1L, "admin", "Administrador", "default", List.of("Administrador"), permissions);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtService.generateToken(user));
        return headers;
    }

    private HttpHeaders apiKey(String rawKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(ApiKeyAuthenticationFilter.API_KEY_HEADER, rawKey);
        return headers;
    }

    /** Crea una key con todos los scopes y devuelve el secreto completo. */
    private String createKey(Set<String> scopes) {
        ResponseEntity<CreatedApiKeyDto> created = rest.exchange(
                "/api/integration/keys", HttpMethod.POST,
                new HttpEntity<>(new CreateApiKeyRequest("e-commerce", scopes),
                        jwt(List.of("integrations.manage"))),
                CreatedApiKeyDto.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getBody()).isNotNull();
        assertThat(created.getBody().apiKey()).contains(".");
        return created.getBody().apiKey();
    }

    @Test
    void healthIsPublic() {
        ResponseEntity<String> response = rest.getForEntity("/api/integration/health", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void keyManagementRequiresAuthentication() {
        ResponseEntity<String> response = rest.getForEntity("/api/integration/keys", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void keyManagementRequiresPermission() {
        ResponseEntity<String> response = rest.exchange(
                "/api/integration/keys", HttpMethod.GET,
                new HttpEntity<>(jwt(List.of("catalog.read"))), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void createInvalidScopeIsRejected() {
        ResponseEntity<String> response = rest.exchange(
                "/api/integration/keys", HttpMethod.POST,
                new HttpEntity<>(new CreateApiKeyRequest("bad", Set.of("nope:invalid")),
                        jwt(List.of("integrations.manage"))),
                String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void createListAndRevokeKey() {
        String raw = createKey(Set.of("catalog:read"));
        assertThat(raw).startsWith("cmbt_");

        ResponseEntity<Object[]> list = rest.exchange(
                "/api/integration/keys", HttpMethod.GET,
                new HttpEntity<>(jwt(List.of("integrations.manage"))), Object[].class);
        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(list.getBody()).isNotEmpty();
    }

    @Test
    void publicApiRequiresApiKey() {
        ResponseEntity<String> response = rest.getForEntity("/api/integration/v1/catalog", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void publicCatalogWorksWithValidScope() {
        Mockito.when(catalogGateway.listProducts("default")).thenReturn(List.of(
                new ProductView(1L, "Hamburguesa", "Clásica", new BigDecimal("25000"),
                        true, 3L, "Hamburguesas")));

        String raw = createKey(Set.of("catalog:read"));

        ResponseEntity<ProductView[]> response = rest.exchange(
                "/api/integration/v1/catalog", HttpMethod.GET,
                new HttpEntity<>(apiKey(raw)), ProductView[].class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody()[0].name()).isEqualTo("Hamburguesa");
    }

    @Test
    void publicApiRejectsMissingScope() {
        // La key solo tiene orders:read, pero intenta leer el catálogo.
        String raw = createKey(Set.of("orders:read"));

        ResponseEntity<String> response = rest.exchange(
                "/api/integration/v1/catalog", HttpMethod.GET,
                new HttpEntity<>(apiKey(raw)), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void publicApiRejectsInvalidApiKey() {
        ResponseEntity<String> response = rest.exchange(
                "/api/integration/v1/catalog", HttpMethod.GET,
                new HttpEntity<>(apiKey("cmbt_nonexistent.whatever")), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void createOrderForwardsToOrdersService() {
        OrderView view = new OrderView(
                99L, "DELIVERY", "LOCAL", "OPEN", "Ana", "3001112233", "Cra 1",
                "web", new BigDecimal("25000"), Instant.now(),
                List.of(new OrderView.Item(1L, "Hamburguesa", new BigDecimal("25000"), 1, null)));
        Mockito.when(ordersGateway.createOrder(Mockito.eq("default"), Mockito.any())).thenReturn(view);

        String raw = createKey(Set.of("orders:write"));

        Map<String, Object> body = Map.of(
                "type", "DELIVERY",
                "customerName", "Ana",
                "items", List.of(Map.of(
                        "productName", "Hamburguesa",
                        "unitPrice", 25000,
                        "quantity", 1)));

        ResponseEntity<OrderView> response = rest.exchange(
                "/api/integration/v1/orders", HttpMethod.POST,
                new HttpEntity<>(body, apiKey(raw)), OrderView.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(99L);
    }
}
