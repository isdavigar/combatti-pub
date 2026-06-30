package com.combatti.auth;

import com.combatti.auth.web.dto.ChangePasswordRequest;
import com.combatti.auth.web.dto.CreateUserRequest;
import com.combatti.auth.web.dto.LoginRequest;
import com.combatti.auth.web.dto.LoginResponse;
import com.combatti.auth.web.dto.ResetPasswordRequest;
import com.combatti.auth.web.dto.RoleDto;
import com.combatti.auth.web.dto.UserSummaryDto;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class UserManagementIntegrationTest {

    private static final String SECRET = "dev-secret-change-me-please-change-me-32";
    private static final String ISSUER = "combatti-auth";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private TestRestTemplate rest;

    private final JwtService jwtService = new JwtService(SECRET, 3600, ISSUER);

    private HttpHeaders headers(List<String> permissions) {
        AuthenticatedUser user = new AuthenticatedUser(
                999L, "admin", "Administrador", "default", List.of("Administrador"), permissions);
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(jwtService.generateToken(user));
        return h;
    }

    private HttpHeaders admin() {
        return headers(List.of("users.manage"));
    }

    private HttpHeaders tokenFor(String username, String password) {
        LoginResponse login = rest.postForEntity(
                "/api/auth/login", new LoginRequest(username, password, null), LoginResponse.class).getBody();
        assertThat(login).isNotNull();
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(login.token());
        return h;
    }

    @Test
    void createsUserAndListsIt() {
        CreateUserRequest req = new CreateUserRequest(
                "cajero1", "Cajero Uno", "secret123", List.of("Cajero"), true);

        ResponseEntity<UserSummaryDto> created = rest.exchange(
                "/api/auth/users", HttpMethod.POST, new HttpEntity<>(req, admin()), UserSummaryDto.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getBody()).isNotNull();
        assertThat(created.getBody().roles()).contains("Cajero");

        ResponseEntity<UserSummaryDto[]> list = rest.exchange(
                "/api/auth/users", HttpMethod.GET, new HttpEntity<>(admin()), UserSummaryDto[].class);
        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(list.getBody()).isNotNull();
        boolean found = java.util.Arrays.stream(list.getBody()).anyMatch(u -> "cajero1".equals(u.username()));
        assertThat(found).isTrue();
    }

    @Test
    void createdUserCanLogin() {
        CreateUserRequest req = new CreateUserRequest(
                "mesero1", "Mesero Uno", "secret123", List.of("Mesero"), true);
        rest.exchange("/api/auth/users", HttpMethod.POST, new HttpEntity<>(req, admin()), UserSummaryDto.class);

        ResponseEntity<LoginResponse> login = rest.postForEntity(
                "/api/auth/login", new LoginRequest("mesero1", "secret123", null), LoginResponse.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(login.getBody()).isNotNull();
        assertThat(login.getBody().user().roles()).contains("Mesero");
    }

    @Test
    void duplicateUsernameIsRejected() {
        CreateUserRequest req = new CreateUserRequest(
                "dup1", "Dup", "secret123", List.of("Mesero"), true);
        rest.exchange("/api/auth/users", HttpMethod.POST, new HttpEntity<>(req, admin()), UserSummaryDto.class);

        ResponseEntity<String> second = rest.exchange(
                "/api/auth/users", HttpMethod.POST, new HttpEntity<>(req, admin()), String.class);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void adminResetsPassword() {
        CreateUserRequest req = new CreateUserRequest(
                "reset1", "Reset", "secret123", List.of("Mesero"), true);
        UserSummaryDto user = rest.exchange(
                "/api/auth/users", HttpMethod.POST, new HttpEntity<>(req, admin()), UserSummaryDto.class).getBody();
        assertThat(user).isNotNull();

        ResponseEntity<Void> reset = rest.exchange(
                "/api/auth/users/" + user.id() + "/password", HttpMethod.POST,
                new HttpEntity<>(new ResetPasswordRequest("nuevo12345"), admin()), Void.class);
        assertThat(reset.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<LoginResponse> login = rest.postForEntity(
                "/api/auth/login", new LoginRequest("reset1", "nuevo12345", null), LoginResponse.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void userCanChangeOwnPassword() {
        CreateUserRequest req = new CreateUserRequest(
                "self1", "Self", "old12345", List.of("Mesero"), true);
        rest.exchange("/api/auth/users", HttpMethod.POST, new HttpEntity<>(req, admin()), UserSummaryDto.class);

        HttpHeaders userHeaders = tokenFor("self1", "old12345");
        ResponseEntity<Void> change = rest.exchange(
                "/api/auth/me/password", HttpMethod.POST,
                new HttpEntity<>(new ChangePasswordRequest("old12345", "new12345"), userHeaders), Void.class);
        assertThat(change.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        assertThat(rest.postForEntity("/api/auth/login",
                new LoginRequest("self1", "new12345", null), LoginResponse.class)
                .getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void listsRoles() {
        ResponseEntity<RoleDto[]> roles = rest.exchange(
                "/api/auth/roles", HttpMethod.GET, new HttpEntity<>(admin()), RoleDto[].class);
        assertThat(roles.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(roles.getBody()).isNotNull();
        assertThat(roles.getBody().length).isGreaterThanOrEqualTo(4);
    }

    @Test
    void forbiddenWithoutManagePermission() {
        ResponseEntity<String> response = rest.exchange(
                "/api/auth/users", HttpMethod.GET, new HttpEntity<>(headers(List.of("pos.orders"))), String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
