package com.combatti.reporting;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.reporting.web.dto.SalesReportDto;
import com.combatti.reporting.web.dto.TopProductDto;
import com.combatti.reporting.web.dto.CategorySalesDto;
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
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class ReportingIntegrationTest {

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

    // Rango amplio para evitar problemas de zona horaria en el corte por día.
    private String range() {
        LocalDate today = LocalDate.now();
        return "?from=" + today.minusDays(1) + "&to=" + today.plusDays(1);
    }

    @Test
    void salesReportAggregatesPayments() {
        ResponseEntity<SalesReportDto> response = rest.exchange(
                "/api/reports/sales" + range(), HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("reports.read"))), SalesReportDto.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        SalesReportDto report = response.getBody();
        assertThat(report).isNotNull();
        assertThat(report.total()).isEqualByComparingTo(new BigDecimal("83000"));
        assertThat(report.transactions()).isEqualTo(2);
        assertThat(report.averageTicket()).isEqualByComparingTo(new BigDecimal("41500"));
        assertThat(report.byMethod()).hasSize(2);
    }

    @Test
    void topProductsAreRanked() {
        ResponseEntity<TopProductDto[]> response = rest.exchange(
                "/api/reports/top-products" + range(), HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("reports.read"))), TopProductDto[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().length).isGreaterThanOrEqualTo(2);
        // El primero (más vendido) debe ser la Hamburguesa (3 unidades).
        assertThat(response.getBody()[0].productName()).isEqualTo("Hamburguesa");
        assertThat(response.getBody()[0].quantity()).isEqualTo(3);
    }

    @Test
    void salesByCategoryJoinsCatalog() {
        ResponseEntity<CategorySalesDto[]> response = rest.exchange(
                "/api/reports/by-category" + range(), HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("reports.read"))), CategorySalesDto[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().length).isGreaterThanOrEqualTo(2);
        // Mayor ingreso primero: Hamburguesas (54000) sobre Bebidas (10000).
        assertThat(response.getBody()[0].category()).isEqualTo("Hamburguesas");
        assertThat(response.getBody()[0].revenue()).isEqualByComparingTo(new BigDecimal("54000"));
    }

    @Test
    void requiresAuthentication() {
        ResponseEntity<String> response = rest.getForEntity("/api/reports/sales", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejectsWithoutReportsPermission() {
        ResponseEntity<String> response = rest.exchange(
                "/api/reports/sales" + range(), HttpMethod.GET,
                new HttpEntity<>(bearer(List.of("pos.orders"))), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
