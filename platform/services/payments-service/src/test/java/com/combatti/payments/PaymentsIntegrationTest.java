package com.combatti.payments;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.payments.domain.PaymentMethod;
import com.combatti.payments.web.dto.CreatePaymentRequest;
import com.combatti.payments.web.dto.PaymentDto;
import com.combatti.payments.web.dto.PaymentSplitRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
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
@Import(TestOrderClientConfig.class)
class PaymentsIntegrationTest {

    private static final String SECRET = "dev-secret-change-me-please-change-me-32";
    private static final String ISSUER = "combatti-auth";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private TestOrderClientConfig.FakeOrderClient fakeOrderClient;

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    private HttpHeaders bearer(List<String> permissions) {
        AuthenticatedUser user = new AuthenticatedUser(
                1L, "cajero", "Cajero", "default", List.of("Cajero"), permissions);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtService.generateToken(user));
        return headers;
    }

    @Test
    void cashPaymentComputesChangeAndMarksOrderPaid() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                100L, PaymentMethod.CASH, new BigDecimal("65000"), new BigDecimal("70000"), null, null);

        ResponseEntity<PaymentDto> response = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.cash"))), PaymentDto.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        PaymentDto payment = response.getBody();
        assertThat(payment).isNotNull();
        assertThat(payment.changeGiven()).isEqualByComparingTo(new BigDecimal("5000"));
        assertThat(payment.createdBy()).isEqualTo("cajero");
        assertThat(fakeOrderClient.markedPaid).contains(100L);
    }

    @Test
    void cashPaymentWithInsufficientAmountIsRejected() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                101L, PaymentMethod.CASH, new BigDecimal("65000"), new BigDecimal("60000"), null, null);

        ResponseEntity<String> response = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.cash"))), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(fakeOrderClient.markedPaid).doesNotContain(101L);
    }

    @Test
    void mixedPaymentRequiresSplitsSummingTotal() {
        CreatePaymentRequest ok = new CreatePaymentRequest(
                102L, PaymentMethod.MIXED, new BigDecimal("50000"), null, null,
                List.of(
                        new PaymentSplitRequest(PaymentMethod.CASH, new BigDecimal("20000")),
                        new PaymentSplitRequest(PaymentMethod.NEQUI, new BigDecimal("30000"))
                ));

        ResponseEntity<PaymentDto> okResponse = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(ok, bearer(List.of("pos.cash"))), PaymentDto.class);
        assertThat(okResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(okResponse.getBody()).isNotNull();
        assertThat(okResponse.getBody().splits()).hasSize(2);

        CreatePaymentRequest bad = new CreatePaymentRequest(
                103L, PaymentMethod.MIXED, new BigDecimal("50000"), null, null,
                List.of(new PaymentSplitRequest(PaymentMethod.CASH, new BigDecimal("10000"))));

        ResponseEntity<String> badResponse = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(bad, bearer(List.of("pos.cash"))), String.class);
        assertThat(badResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void electronicPaymentIsRecorded() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                104L, PaymentMethod.NEQUI, new BigDecimal("18000"), null, null, null);

        ResponseEntity<PaymentDto> response = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.cash"))), PaymentDto.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().changeGiven()).isNull();
    }

    @Test
    void alreadyPaidOrderIsRejected() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                200L, PaymentMethod.CASH, new BigDecimal("1000"), new BigDecimal("1000"), null, null);

        ResponseEntity<String> response = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.cash"))), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void nonExistentOrderIsRejected() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                300L, PaymentMethod.CASH, new BigDecimal("1000"), new BigDecimal("1000"), null, null);

        ResponseEntity<String> response = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.cash"))), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void amountMismatchIsRejected() {
        // El pedido 100 tiene subtotal 65000; intentamos cobrar 50000.
        CreatePaymentRequest request = new CreatePaymentRequest(
                100L, PaymentMethod.NEQUI, new BigDecimal("50000"), null, null, null);

        ResponseEntity<String> response = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("pos.cash"))), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void requiresAuthentication() {
        ResponseEntity<String> response = rest.getForEntity("/api/payments", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejectsWithoutCashPermission() {
        CreatePaymentRequest request = new CreatePaymentRequest(
                105L, PaymentMethod.NEQUI, new BigDecimal("1000"), null, null, null);

        ResponseEntity<String> response = rest.exchange(
                "/api/payments", HttpMethod.POST,
                new HttpEntity<>(request, bearer(List.of("catalog.read"))), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
