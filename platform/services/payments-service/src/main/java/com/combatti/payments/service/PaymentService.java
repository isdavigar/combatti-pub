package com.combatti.payments.service;

import com.combatti.payments.domain.Payment;
import com.combatti.payments.domain.PaymentMethod;
import com.combatti.payments.domain.PaymentSplit;
import com.combatti.payments.repository.PaymentRepository;
import com.combatti.payments.web.dto.CreatePaymentRequest;
import com.combatti.payments.web.dto.PaymentDto;
import com.combatti.payments.web.dto.PaymentSplitDto;
import com.combatti.payments.web.dto.PaymentSplitRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> listPayments(String tenantId, Long orderId) {
        List<Payment> payments = (orderId != null)
                ? paymentRepository.findByTenantIdAndOrderIdOrderByCreatedAtDesc(tenantId, orderId)
                : paymentRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        return payments.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public PaymentDto getPayment(String tenantId, Long id) {
        return paymentRepository.findByTenantIdAndId(tenantId, id)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Pago no encontrado: " + id));
    }

    @Transactional
    public PaymentDto createPayment(String tenantId, String createdBy, CreatePaymentRequest request) {
        BigDecimal amount = request.amount();

        Payment payment = new Payment(tenantId, request.orderId(), request.method(), amount);
        payment.setNotes(request.notes());
        payment.setCreatedBy(createdBy);

        if (request.method() == PaymentMethod.CASH) {
            applyCash(payment, request, amount);
        } else if (request.method() == PaymentMethod.MIXED) {
            applyMixed(payment, request, amount);
        }
        // Métodos electrónicos (Nequi/Bancolombia/Bold/Bre-B): sin vuelto ni splits.

        return toDto(paymentRepository.save(payment));
    }

    private void applyCash(Payment payment, CreatePaymentRequest request, BigDecimal amount) {
        BigDecimal received = request.cashReceived();
        if (received == null) {
            throw new BadRequestException("El pago en efectivo requiere el monto recibido (cashReceived)");
        }
        if (received.compareTo(amount) < 0) {
            throw new BadRequestException("El efectivo recibido es menor que el total a cobrar");
        }
        payment.setCashReceived(received);
        payment.setChangeGiven(received.subtract(amount));
    }

    private void applyMixed(Payment payment, CreatePaymentRequest request, BigDecimal amount) {
        List<PaymentSplitRequest> splits = request.splits();
        if (splits == null || splits.isEmpty()) {
            throw new BadRequestException("Un pago mixto requiere el desglose (splits)");
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (PaymentSplitRequest split : splits) {
            sum = sum.add(split.amount());
            payment.addSplit(new PaymentSplit(split.method(), split.amount()));
        }
        if (sum.compareTo(amount) != 0) {
            throw new BadRequestException(
                    "La suma del desglose (" + sum + ") no coincide con el total (" + amount + ")");
        }
    }

    private PaymentDto toDto(Payment payment) {
        List<PaymentSplitDto> splits = payment.getSplits().stream()
                .map(split -> new PaymentSplitDto(split.getMethod(), split.getAmount()))
                .toList();
        return new PaymentDto(
                payment.getId(),
                payment.getOrderId(),
                payment.getMethod(),
                payment.getAmount(),
                payment.getCashReceived(),
                payment.getChangeGiven(),
                payment.getNotes(),
                payment.getCreatedBy(),
                payment.getCreatedAt(),
                splits
        );
    }
}
