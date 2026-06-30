package com.combatti.payments.repository;

import com.combatti.payments.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    List<Payment> findByTenantIdAndOrderIdOrderByCreatedAtDesc(String tenantId, Long orderId);

    Optional<Payment> findByTenantIdAndId(String tenantId, Long id);
}
