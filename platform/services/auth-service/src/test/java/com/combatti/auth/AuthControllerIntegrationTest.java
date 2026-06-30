package com.combatti.auth;

import com.combatti.auth.web.dto.LoginRequest;
import com.combatti.auth.web.dto.LoginResponse;
import com.combatti.auth.web.dto.UserDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test de integración de punta a punta del auth-service usando una base de
 * datos PostgreSQL real (Testcontainers). Requiere Docker disponible (CI).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class AuthControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    @Test
    void loginWithSeededAdminReturnsTokenAndProfile() {
        LoginRequest request = new LoginRequest("admin", "admin123", null);

        ResponseEntity<LoginResponse> response =
                rest.postForEntity("/api/auth/login", request, LoginResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().token()).isNotBlank();
        assertThat(response.getBody().tokenType()).isEqualTo("Bearer");

        UserDto user = response.getBody().user();
        assertThat(user.username()).isEqualTo("admin");
        assertThat(user.roles()).contains("Administrador");
        assertThat(user.permissions()).contains("users.manage", "pos.cash");
    }

    @Test
    void loginWithWrongPasswordReturnsUnauthorized() {
        LoginRequest request = new LoginRequest("admin", "wrong-password", null);

        ResponseEntity<String> response =
                rest.postForEntity("/api/auth/login", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void loginWithBlankFieldsReturnsBadRequest() {
        LoginRequest request = new LoginRequest("", "", null);

        ResponseEntity<String> response =
                rest.postForEntity("/api/auth/login", request, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void meReturnsProfileWhenTokenIsValid() {
        LoginRequest request = new LoginRequest("admin", "admin123", null);
        LoginResponse login = rest.postForEntity("/api/auth/login", request, LoginResponse.class).getBody();
        assertThat(login).isNotNull();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(login.token());
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        ResponseEntity<UserDto> response = rest.exchange(
                "/api/auth/me", HttpMethod.GET, new HttpEntity<>(headers), UserDto.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().username()).isEqualTo("admin");
    }

    @Test
    void meWithoutTokenReturnsUnauthorized() {
        ResponseEntity<String> response = rest.getForEntity("/api/auth/me", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
