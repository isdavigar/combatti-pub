package com.combatti.cash.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Turno de caja. Un tenant solo puede tener una sesión OPEN a la vez.
 */
@Entity
@Table(name = "cash_sessions")
public class CashSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 64)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    private CashSessionStatus status = CashSessionStatus.OPEN;

    @Column(name = "opening_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingAmount;

    @Column(name = "opened_by", length = 120)
    private String openedBy;

    @Column(name = "opened_at", nullable = false)
    private Instant openedAt;

    @Column(name = "closed_by", length = 120)
    private String closedBy;

    @Column(name = "closed_at")
    private Instant closedAt;

    /** Efectivo contado declarado al cierre. */
    @Column(name = "counted_cash", precision = 12, scale = 2)
    private BigDecimal countedCash;

    /** Efectivo esperado calculado al cierre (fondo + ingresos - egresos). */
    @Column(name = "expected_cash", precision = 12, scale = 2)
    private BigDecimal expectedCash;

    /** Diferencia contado - esperado (positivo: sobra, negativo: falta). */
    @Column(name = "difference", precision = 12, scale = 2)
    private BigDecimal difference;

    @Column(name = "notes", length = 500)
    private String notes;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<CashMovement> movements = new ArrayList<>();

    protected CashSession() {
    }

    public CashSession(String tenantId, BigDecimal openingAmount, String openedBy) {
        this.tenantId = tenantId;
        this.openingAmount = openingAmount;
        this.openedBy = openedBy;
        this.status = CashSessionStatus.OPEN;
        this.openedAt = Instant.now();
    }

    public void addMovement(CashMovement movement) {
        movement.setSession(this);
        this.movements.add(movement);
    }

    /** Suma de ingresos manuales. */
    public BigDecimal totalIncome() {
        return movements.stream()
                .filter(m -> m.getType() == MovementType.INCOME)
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Suma de egresos manuales. */
    public BigDecimal totalExpense() {
        return movements.stream()
                .filter(m -> m.getType() == MovementType.EXPENSE)
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Efectivo esperado en caja: fondo + ingresos - egresos. */
    public BigDecimal computeExpectedCash() {
        return openingAmount.add(totalIncome()).subtract(totalExpense());
    }

    public void close(BigDecimal countedCash, String closedBy, String closeNotes) {
        this.expectedCash = computeExpectedCash();
        this.countedCash = countedCash;
        this.difference = countedCash.subtract(this.expectedCash);
        this.closedBy = closedBy;
        this.closedAt = Instant.now();
        this.status = CashSessionStatus.CLOSED;
        if (closeNotes != null && !closeNotes.isBlank()) {
            this.notes = closeNotes;
        }
    }

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public CashSessionStatus getStatus() {
        return status;
    }

    public BigDecimal getOpeningAmount() {
        return openingAmount;
    }

    public String getOpenedBy() {
        return openedBy;
    }

    public Instant getOpenedAt() {
        return openedAt;
    }

    public String getClosedBy() {
        return closedBy;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public BigDecimal getCountedCash() {
        return countedCash;
    }

    public BigDecimal getExpectedCash() {
        return expectedCash;
    }

    public BigDecimal getDifference() {
        return difference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<CashMovement> getMovements() {
        return movements;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof CashSession that)) {
            return false;
        }
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
