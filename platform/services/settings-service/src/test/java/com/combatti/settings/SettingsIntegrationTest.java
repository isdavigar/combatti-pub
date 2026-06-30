package com.combatti.settings;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.settings.web.dto.SettingsDto;
import com.combatti.settings.web.dto.UpdateSettingsRequest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SettingsIntegrationTest {

    private static final String SECRET = "dev-secret-change-me-please-change-me-32";
    private static final String ISSUER = "combatti-auth";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    private HttpHeaders bearer(List<String> permissions) {
        AuthenticatedUser user = new AuthenticatedUser(
                1L, "admin", "Administrador", "default", List.of("Administrador"), permissions);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtService.generateToken(user));
        return headers;
    }

    private UpdateSettingsRequest sampleRequest() {
        return new UpdateSettingsRequest(
                "Combatti Bar & Grill",
                "900123456-7",
                "Cra 1 # 2-3",
                "3001234567",
                "hola@combatti.co",
                "COP",
                new BigDecimal("8.00"),
                new BigDecimal("10.00"),
                new BigDecimal("10.00"),
                "¡Vuelve pronto!",
                "network",
                "192.168.1.50",
                9100,
                "192.168.1.51",
                9100);
    }

    @Test
    @Order(1)
    void requiresAuthentication() {
        ResponseEntity<String> response = rest.getForEntity("/api/settings", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @Order(2)
    void anyAuthenticatedUserCanRead() {
        ResponseEntity<SettingsDto> response = rest.exchange(
                "/api/settings", HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("catalog.read"))), SettingsDto.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().restaurantName()).isEqualTo("Combatti");
        assertThat(response.getBody().currency()).isEqualTo("COP");
    }

    @Test
    @Order(3)
    void updateRequiresSettingsManagePermission() {
        ResponseEntity<String> response = rest.exchange(
                "/api/settings", HttpMethod.PUT,
                new HttpEntity<>(sampleRequest(), bearer(List.of("catalog.read"))), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @Order(4)
    void updatePersistsChanges() {
        ResponseEntity<SettingsDto> updated = rest.exchange(
                "/api/settings", HttpMethod.PUT,
                new HttpEntity<>(sampleRequest(), bearer(List.of("settings.manage"))), SettingsDto.class);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody()).isNotNull();
        assertThat(updated.getBody().restaurantName()).isEqualTo("Combatti Bar & Grill");
        assertThat(updated.getBody().printerTransport()).isEqualTo("network");
        assertThat(updated.getBody().taxRatePercent()).isEqualByComparingTo(new BigDecimal("8.00"));

        // Y se refleja en la lectura.
        ResponseEntity<SettingsDto> after = rest.exchange(
                "/api/settings", HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("settings.manage"))), SettingsDto.class);
        assertThat(after.getBody()).isNotNull();
        assertThat(after.getBody().receiptFooter()).isEqualTo("¡Vuelve pronto!");
    }

    @Test
    @Order(5)
    void invalidPayloadIsRejected() {
        UpdateSettingsRequest invalid = new UpdateSettingsRequest(
                "", null, null, null, null, "COP",
                null, null, null, null, null, null, null, null, null);
        ResponseEntity<String> response = rest.exchange(
                "/api/settings", HttpMethod.PUT,
                new HttpEntity<>(invalid, bearer(List.of("settings.manage"))), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
