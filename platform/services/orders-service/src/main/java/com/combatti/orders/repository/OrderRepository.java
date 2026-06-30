package com.combatti.orders.repository;

import com.combatti.orders.domain.Order;
import com.combatti.orders.domain.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<Order> findByTenantIdAndStatusInOrderByCreatedAtAsc(String tenantId, Collection<OrderStatus> statuses);

    Optional<Order> findByTenantIdAndId(String tenantId, Long id);

    @Query("""
            SELECT DISTINCT o.table.id
            FROM Order o
            WHERE o.tenantId = :tenantId
              AND o.table IS NOT NULL
              AND o.status IN :statuses
            """)
    List<Long> findOccupiedTableIds(@Param("tenantId") String tenantId,
                                    @Param("statuses") Collection<OrderStatus> statuses);
}
