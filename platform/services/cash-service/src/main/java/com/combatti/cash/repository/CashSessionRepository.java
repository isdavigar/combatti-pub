package com.combatti.cash.repository;

import com.combatti.cash.domain.CashSession;
import com.combatti.cash.domain.CashSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CashSessionRepository extends JpaRepository<CashSession, Long> {

    Optional<CashSession> findByTenantIdAndStatus(String tenantId, CashSessionStatus status);

    Optional<CashSession> findByTenantIdAndId(String tenantId, Long id);

    List<CashSession> findTop50ByTenantIdOrderByOpenedAtDesc(String tenantId);
}
