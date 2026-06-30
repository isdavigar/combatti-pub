package com.combatti.auth.repository;

import com.combatti.auth.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByTenantIdAndUsername(String tenantId, String username);

    Optional<AppUser> findByTenantIdAndId(String tenantId, Long id);

    java.util.List<AppUser> findByTenantIdOrderByUsernameAsc(String tenantId);

    boolean existsByTenantIdAndUsername(String tenantId, String username);
}
