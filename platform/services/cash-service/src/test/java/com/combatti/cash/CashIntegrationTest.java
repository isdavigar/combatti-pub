package com.combatti.cash;

import com.combatti.cash.domain.CashSessionStatus;
import com.combatti.cash.domain.MovementType;
import com.combatti.cash.web.dto.CashSessionDto;
import com.combatti.cash.web.dto.CloseCashRequest;
import com.combatti.cash.web.dto.MovementRequest;
import com.combatti.cash.web.dto.OpenCashRequest;
import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
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

/**
 * Flujo completo de caja en orden: estado inicial sin caja, apertura,
 * movimientos, arqueo al cierre y permisos.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CashIntegrationTest {

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
                1L, "cajero", "Cajero", "default", List.of("Cajero"), permissions);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtService.generateToken(user));
        return headers;
    }

    private HttpHeaders cash() {
        return bearer(List.of("pos.cash"));
    }

    @Test
    @Order(1)
    void noOpenSessionInitially() {
        ResponseEntity<CashSessionDto> response = rest.exchange(
                "/api/cash/current", HttpMethod.GET, new HttpEntity<>(cash()), CashSessionDto.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @Order(2)
    void requiresAuthentication() {
        ResponseEntity<String> response = rest.getForEntity("/api/cash/current", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @Order(3)
    void fullCashFlow() {
        // Abrir caja con fondo 100000.
        ResponseEntity<CashSessionDto> opened = rest.exchange(
                "/api/cash/open", HttpMethod.POST,
                new HttpEntity<>(new OpenCashRequest(new BigDecimal("100000"), "Turno mañana"), cash()),
                CashSessionDto.class);
        assertThat(opened.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(opened.getBody()).isNotNull();
        assertThat(opened.getBody().status()).isEqualTo(CashSessionStatus.OPEN);

        // Intentar abrir otra debe fallar (ya hay una abierta).
        ResponseEntity<String> secondOpen = rest.exchange(
                "/api/cash/open", HttpMethod.POST,
                new HttpEntity<>(new OpenCashRequest(new BigDecimal("50000"), null), cash()), String.class);
        assertThat(secondOpen.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        // Registrar ingreso 20000 y egreso 5000.
        rest.exchange("/api/cash/movements", HttpMethod.POST,
                new HttpEntity<>(new MovementRequest(MovementType.INCOME, new BigDecimal("20000"), "Aporte"), cash()),
                CashSessionDto.class);
        ResponseEntity<CashSessionDto> afterMoves = rest.exchange(
                "/api/cash/movements", HttpMethod.POST,
                new HttpEntity<>(new MovementRequest(MovementType.EXPENSE, new BigDecimal("5000"), "Domicilio"), cash()),
                CashSessionDto.class);

        assertThat(afterMoves.getBody()).isNotNull();
        // balance = 100000 + 20000 - 5000 = 115000
        assertThat(afterMoves.getBody().balance()).isEqualByComparingTo(new BigDecimal("115000"));
        assertThat(afterMoves.getBody().movements()).hasSize(2);

        // Cerrar declarando 114000 contados -> faltante de 1000.
        ResponseEntity<CashSessionDto> closed = rest.exchange(
                "/api/cash/close", HttpMethod.POST,
                new HttpEntity<>(new CloseCashRequest(new BigDecimal("114000"), "Cierre"), cash()),
                CashSessionDto.class);
        assertThat(closed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(closed.getBody()).isNotNull();
        assertThat(closed.getBody().status()).isEqualTo(CashSessionStatus.CLOSED);
        assertThat(closed.getBody().expectedCash()).isEqualByComparingTo(new BigDecimal("115000"));
        assertThat(closed.getBody().difference()).isEqualByComparingTo(new BigDecimal("-1000"));

        // Tras cerrar, no debe haber caja abierta.
        ResponseEntity<CashSessionDto> current = rest.exchange(
                "/api/cash/current", HttpMethod.GET, new HttpEntity<>(cash()), CashSessionDto.class);
        assertThat(current.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @Order(4)
    void closeWithoutOpenSessionIsRejected() {
        ResponseEntity<String> response = rest.exchange(
                "/api/cash/close", HttpMethod.POST,
                new HttpEntity<>(new CloseCashRequest(new BigDecimal("0"), null), cash()), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @Order(5)
    void rejectsWithoutCashPermission() {
        ResponseEntity<String> response = rest.exchange(
                "/api/cash/current", HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("catalog.read"))), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
