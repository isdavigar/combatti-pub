package com.combatti.posbridge;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import com.combatti.posbridge.web.dto.ReceiptLine;
import com.combatti.posbridge.web.dto.ReceiptRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestPrinterConfig.class)
class PosBridgeIntegrationTest {

    private static final String SECRET = "dev-secret-change-me-please-change-me-32";
    private static final String ISSUER = "combatti-auth";

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private TestPrinterConfig.CapturingPrinterTransport transport;

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    private HttpHeaders auth() {
        AuthenticatedUser user = new AuthenticatedUser(
                1L, "cajero", "Cajero", "default", List.of("Cajero"), List.of("pos.cash"));
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtService.generateToken(user));
        return headers;
    }

    private static boolean containsSequence(byte[] data, byte[] seq) {
        outer:
        for (int i = 0; i <= data.length - seq.length; i++) {
            for (int j = 0; j < seq.length; j++) {
                if (data[i + j] != seq[j]) {
                    continue outer;
                }
            }
            return true;
        }
        return false;
    }

    @Test
    void printsReceiptAndOpensDrawer() {
        ReceiptRequest request = new ReceiptRequest(
                42L,
                List.of(new ReceiptLine("Hamburguesa", 2, new BigDecimal("36000"))),
                new BigDecimal("36000"),
                "CASH",
                new BigDecimal("40000"),
                new BigDecimal("4000"),
                true);

        ResponseEntity<String> response = rest.exchange(
                "/api/pos/print/receipt", HttpMethod.POST,
                new HttpEntity<>(request, auth()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        byte[] printed = transport.last();
        // Comienza con init ESC @.
        assertThat(printed[0]).isEqualTo((byte) 0x1B);
        assertThat(printed[1]).isEqualTo((byte) 0x40);
        // Incluye el pulso de apertura de cajón (ESC p).
        assertThat(containsSequence(printed, new byte[]{(byte) 0x1B, (byte) 'p'})).isTrue();
    }

    @Test
    void opensCashDrawer() {
        ResponseEntity<String> response = rest.exchange(
                "/api/pos/cash-drawer/open", HttpMethod.POST,
                new HttpEntity<>(auth()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(containsSequence(transport.last(), new byte[]{(byte) 0x1B, (byte) 'p'})).isTrue();
    }

    @Test
    void healthIsPublic() {
        ResponseEntity<String> response = rest.getForEntity("/api/pos/health", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void requiresAuthentication() {
        ReceiptRequest request = new ReceiptRequest(
                1L, List.of(), new BigDecimal("0"), null, null, null, false);
        ResponseEntity<String> response = rest.postForEntity("/api/pos/print/receipt", request, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
