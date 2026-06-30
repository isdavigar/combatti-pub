package com.combatti.gateway.filter;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import io.jsonwebtoken.JwtException;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.cors.reactive.CorsUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Filtro global que valida el JWT de las peticiones entrantes. Las rutas
 * públicas (login, health) quedan exentas. Si el token es válido, propaga
 * la identidad a los servicios downstream mediante encabezados {@code X-*}.
 */
@Component
public class JwtGlobalFilter implements GlobalFilter, Ordered {

    private static final String BEARER_PREFIX = "Bearer ";

    /** Rutas que no requieren autenticación. */
    private static final List<String> WHITELIST = List.of(
            "/api/auth/login",
            "/api/auth/health",
            "/api/catalog/health",
            "/api/orders/health",
            "/api/payments/health",
            "/api/cash/health",
            "/actuator/**"
    );

    private final JwtService jwtService;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtGlobalFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Las preflight CORS (OPTIONS) y las rutas públicas pasan sin validación.
        if (CorsUtils.isPreFlightRequest(request) || isWhitelisted(request.getURI().getPath())) {
            return chain.filter(exchange);
        }

        String header = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            return unauthorized(exchange);
        }

        String token = header.substring(BEARER_PREFIX.length()).trim();
        try {
            AuthenticatedUser user = jwtService.parseToken(token);
            ServerHttpRequest mutated = request.mutate()
                    .header("X-User-Id", user.userId() == null ? "" : String.valueOf(user.userId()))
                    .header("X-Username", nullSafe(user.username()))
                    .header("X-Tenant-Id", nullSafe(user.tenantId()))
                    .header("X-Roles", user.roles() == null ? "" : String.join(",", user.roles()))
                    .header("X-Permissions", user.permissions() == null ? "" : String.join(",", user.permissions()))
                    .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (JwtException | IllegalArgumentException ex) {
            return unauthorized(exchange);
        }
    }

    private boolean isWhitelisted(String path) {
        return WHITELIST.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    private static String nullSafe(String value) {
        return value == null ? "" : value;
    }

    @Override
    public int getOrder() {
        // Se ejecuta antes del enrutamiento.
        return -1;
    }
}
