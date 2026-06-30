package com.combatti.integration.security;

import com.combatti.integration.domain.ApiKey;
import com.combatti.integration.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Autentica peticiones a la API pública mediante el header {@code X-Api-Key}
 * (formato {@code prefijo.secreto}). Las autoridades concedidas son los scopes
 * de la key (p. ej. {@code catalog:read}).
 */
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    public static final String API_KEY_HEADER = "X-Api-Key";

    private final ApiKeyService apiKeyService;

    public ApiKeyAuthenticationFilter(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String rawKey = request.getHeader(API_KEY_HEADER);

        if (StringUtils.hasText(rawKey)
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            apiKeyService.authenticate(rawKey).ifPresent(apiKey -> authenticate(apiKey, request));
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(ApiKey apiKey, HttpServletRequest request) {
        List<SimpleGrantedAuthority> authorities = apiKey.getScopes().stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
        ApiKeyPrincipal principal = new ApiKeyPrincipal(
                apiKey.getId(), apiKey.getTenantId(), apiKey.getName());
        var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
