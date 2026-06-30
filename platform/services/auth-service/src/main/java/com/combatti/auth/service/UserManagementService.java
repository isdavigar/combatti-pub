package com.combatti.auth.service;

import com.combatti.auth.domain.AppUser;
import com.combatti.auth.domain.Role;
import com.combatti.auth.repository.RoleRepository;
import com.combatti.auth.repository.UserRepository;
import com.combatti.auth.web.dto.ChangePasswordRequest;
import com.combatti.auth.web.dto.CreateUserRequest;
import com.combatti.auth.web.dto.RoleDto;
import com.combatti.auth.web.dto.UpdateUserRequest;
import com.combatti.auth.web.dto.UserSummaryDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(UserRepository userRepository,
                                 RoleRepository roleRepository,
                                 PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> listUsers(String tenantId) {
        return userRepository.findByTenantIdOrderByUsernameAsc(tenantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoleDto> listRoles() {
        return roleRepository.findAll().stream()
                .sorted(Comparator.comparing(Role::getName))
                .map(r -> new RoleDto(r.getId(), r.getName(), r.getDescription()))
                .toList();
    }

    @Transactional
    public UserSummaryDto createUser(String tenantId, CreateUserRequest request) {
        String username = request.username().trim();
        if (userRepository.existsByTenantIdAndUsername(tenantId, username)) {
            throw new ConflictException("Ya existe un usuario con el nombre '" + username + "'");
        }
        AppUser user = new AppUser(
                tenantId, username, passwordEncoder.encode(request.password()), request.displayName().trim());
        user.setEnabled(request.enabled() == null || request.enabled());
        assignRoles(user, request.roles());
        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserSummaryDto updateUser(String tenantId, Long id, UpdateUserRequest request) {
        AppUser user = requireUser(tenantId, id);
        user.setDisplayName(request.displayName().trim());
        if (request.enabled() != null) {
            user.setEnabled(request.enabled());
        }
        user.clearRoles();
        assignRoles(user, request.roles());
        return toDto(user);
    }

    @Transactional
    public void resetPassword(String tenantId, Long id, String newPassword) {
        AppUser user = requireUser(tenantId, id);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    @Transactional
    public void deleteUser(String tenantId, Long id, Long currentUserId) {
        AppUser user = requireUser(tenantId, id);
        if (currentUserId != null && currentUserId.equals(user.getId())) {
            throw new BadRequestException("No puedes eliminar tu propia cuenta");
        }
        userRepository.delete(user);
    }

    @Transactional
    public void changeOwnPassword(String tenantId, String username, ChangePasswordRequest request) {
        AppUser user = userRepository.findByTenantIdAndUsername(tenantId, username)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("La contraseña actual no es correcta");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    private void assignRoles(AppUser user, List<String> roleNames) {
        for (String name : roleNames) {
            Role role = roleRepository.findByName(name)
                    .orElseThrow(() -> new BadRequestException("Rol no válido: " + name));
            user.addRole(role);
        }
    }

    private AppUser requireUser(String tenantId, Long id) {
        return userRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado: " + id));
    }

    private UserSummaryDto toDto(AppUser user) {
        return new UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getTenantId(),
                new ArrayList<>(user.getRoleNames()),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }
}
