package com.combatti.settings.repository;

import com.combatti.settings.domain.TenantSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantSettingsRepository extends JpaRepository<TenantSettings, Long> {

    Optional<TenantSettings> findByTenantId(String tenantId);
}
