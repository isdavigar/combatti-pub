package com.combatti.auth.service;

import com.combatti.auth.config.JwtProperties;
import com.combatti.auth.domain.AppUser;
import com.combatti.auth.repository.UserRepository;
import com.combatti.auth.web.dto.LoginRequest;
import com.combatti.auth.web.dto.LoginResponse;
import com.combatti.auth.web.dto.UserDto;
import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class AuthService {

    private static final String DEFAULT_TENANT = "default";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String tenantId = StringUtils.hasText(request.tenantId())
                ? request.tenantId().trim()
                : DEFAULT_TENANT;

        AppUser user = userRepository
                .findByTenantIdAndUsername(tenantId, request.username().trim())
                .orElseThrow(() -> new BadCredentialsException("Usuario o contraseña inválidos"));

        if (!user.isEnabled()) {
            throw new BadCredentialsException("La cuenta está deshabilitada");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Usuario o contraseña inválidos");
        }

        AuthenticatedUser principal = toPrincipal(user);
        String token = jwtService.generateToken(principal);

        return new LoginResponse(
                token,
                "Bearer",
                jwtProperties.getExpirationSeconds(),
                toDto(principal)
        );
    }

    public UserDto toDto(AuthenticatedUser principal) {
        return new UserDto(
                principal.userId(),
                principal.username(),
                principal.displayName(),
                principal.tenantId(),
                principal.roles(),
                principal.permissions()
        );
    }

    private AuthenticatedUser toPrincipal(AppUser user) {
        return new AuthenticatedUser(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getTenantId(),
                List.copyOf(user.getRoleNames()),
                List.copyOf(user.getEffectivePermissions())
        );
    }
}
