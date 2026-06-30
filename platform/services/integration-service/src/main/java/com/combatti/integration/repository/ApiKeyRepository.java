package com.combatti.integration.repository;

import com.combatti.integration.domain.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {

    Optional<ApiKey> findByKeyPrefix(String keyPrefix);

    List<ApiKey> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    Optional<ApiKey> findByIdAndTenantId(Long id, String tenantId);
}
