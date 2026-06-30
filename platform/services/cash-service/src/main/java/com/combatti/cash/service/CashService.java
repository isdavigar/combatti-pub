package com.combatti.cash.service;

import com.combatti.cash.domain.CashMovement;
import com.combatti.cash.domain.CashSession;
import com.combatti.cash.domain.CashSessionStatus;
import com.combatti.cash.repository.CashSessionRepository;
import com.combatti.cash.web.dto.CashMovementDto;
import com.combatti.cash.web.dto.CashSessionDto;
import com.combatti.cash.web.dto.CloseCashRequest;
import com.combatti.cash.web.dto.MovementRequest;
import com.combatti.cash.web.dto.OpenCashRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CashService {

    private final CashSessionRepository sessionRepository;

    public CashService(CashSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Transactional(readOnly = true)
    public Optional<CashSessionDto> getCurrentSession(String tenantId) {
        return sessionRepository.findByTenantIdAndStatus(tenantId, CashSessionStatus.OPEN)
                .map(this::toDto);
    }

    @Transactional
    public CashSessionDto openCash(String tenantId, String user, OpenCashRequest request) {
        sessionRepository.findByTenantIdAndStatus(tenantId, CashSessionStatus.OPEN)
                .ifPresent(s -> {
                    throw new BadRequestException("Ya hay una caja abierta. Ciérrala antes de abrir otra.");
                });
        CashSession session = new CashSession(tenantId, request.openingAmount(), user);
        session.setNotes(request.notes());
        return toDto(sessionRepository.save(session));
    }

    @Transactional
    public CashSessionDto closeCash(String tenantId, String user, CloseCashRequest request) {
        CashSession session = requireOpenSession(tenantId);
        session.close(request.countedCash(), user, request.notes());
        return toDto(session);
    }

    @Transactional
    public CashSessionDto addMovement(String tenantId, String user, MovementRequest request) {
        CashSession session = requireOpenSession(tenantId);
        session.addMovement(new CashMovement(
                tenantId, request.type(), request.amount(), request.concept(), user));
        return toDto(session);
    }

    @Transactional(readOnly = true)
    public List<CashSessionDto> listSessions(String tenantId) {
        return sessionRepository.findTop50ByTenantIdOrderByOpenedAtDesc(tenantId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CashSessionDto getSession(String tenantId, Long id) {
        return sessionRepository.findByTenantIdAndId(tenantId, id)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Sesión de caja no encontrada: " + id));
    }

    private CashSession requireOpenSession(String tenantId) {
        return sessionRepository.findByTenantIdAndStatus(tenantId, CashSessionStatus.OPEN)
                .orElseThrow(() -> new BadRequestException("No hay ninguna caja abierta."));
    }

    private CashSessionDto toDto(CashSession session) {
        List<CashMovementDto> movements = session.getMovements().stream()
                .map(m -> new CashMovementDto(
                        m.getId(), m.getType(), m.getAmount(), m.getConcept(),
                        m.getCreatedBy(), m.getCreatedAt()))
                .toList();

        return new CashSessionDto(
                session.getId(),
                session.getStatus(),
                session.getOpeningAmount(),
                session.getOpenedBy(),
                session.getOpenedAt(),
                session.getClosedBy(),
                session.getClosedAt(),
                session.totalIncome(),
                session.totalExpense(),
                session.computeExpectedCash(),
                session.getExpectedCash(),
                session.getCountedCash(),
                session.getDifference(),
                session.getNotes(),
                movements
        );
    }
}
