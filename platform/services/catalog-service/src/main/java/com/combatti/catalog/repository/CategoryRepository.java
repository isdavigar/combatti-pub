package com.combatti.catalog.repository;

import com.combatti.catalog.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByTenantIdOrderByDisplayOrderAscNameAsc(String tenantId);

    Optional<Category> findByTenantIdAndId(String tenantId, Long id);

    Optional<Category> findByTenantIdAndName(String tenantId, String name);

    boolean existsByTenantIdAndName(String tenantId, String name);
}
