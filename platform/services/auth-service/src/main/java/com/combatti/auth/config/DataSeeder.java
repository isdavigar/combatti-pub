package com.combatti.auth.config;

import com.combatti.auth.domain.AppUser;
import com.combatti.auth.domain.Role;
import com.combatti.auth.repository.RoleRepository;
import com.combatti.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea el usuario administrador inicial si todavía no existe. Es idempotente:
 * en arranques posteriores no hace nada.
 */
@Component
@EnableConfigurationProperties(SeedProperties.class)
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String ADMIN_ROLE = "Administrador";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedProperties seed;

    public DataSeeder(UserRepository userRepository,
                      RoleRepository roleRepository,
                      PasswordEncoder passwordEncoder,
                      SeedProperties seed) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.seed = seed;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByTenantIdAndUsername(seed.getTenantId(), seed.getAdminUsername())) {
            log.info("Usuario administrador '{}' ya existe; se omite el seed.", seed.getAdminUsername());
            return;
        }

        Role adminRole = roleRepository.findByName(ADMIN_ROLE)
                .orElseThrow(() -> new IllegalStateException(
                        "El rol '" + ADMIN_ROLE + "' no existe. ¿Se ejecutaron las migraciones Flyway?"));

        AppUser admin = new AppUser(
                seed.getTenantId(),
                seed.getAdminUsername(),
                passwordEncoder.encode(seed.getAdminPassword()),
                seed.getAdminDisplayName()
        );
        admin.addRole(adminRole);
        userRepository.save(admin);

        log.info("Usuario administrador '{}' creado para el tenant '{}'.",
                seed.getAdminUsername(), seed.getTenantId());
    }
}
