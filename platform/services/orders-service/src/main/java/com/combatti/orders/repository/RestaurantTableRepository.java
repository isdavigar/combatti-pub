package com.combatti.orders.repository;

import com.combatti.orders.domain.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    List<RestaurantTable> findByTenantIdOrderBySortOrderAscNameAsc(String tenantId);

    Optional<RestaurantTable> findByTenantIdAndId(String tenantId, Long id);

    boolean existsByTenantIdAndName(String tenantId, String name);

    long countByTenantId(String tenantId);
}
