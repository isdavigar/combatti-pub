package com.combatti.catalog.repository;

import com.combatti.catalog.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByTenantIdOrderByNameAsc(String tenantId);

    List<Product> findByTenantIdAndCategoryIdOrderByNameAsc(String tenantId, Long categoryId);

    Optional<Product> findByTenantIdAndId(String tenantId, Long id);
}
