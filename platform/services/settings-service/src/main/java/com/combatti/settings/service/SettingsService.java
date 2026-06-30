package com.combatti.settings.service;

import com.combatti.settings.domain.TenantSettings;
import com.combatti.settings.repository.TenantSettingsRepository;
import com.combatti.settings.web.dto.SettingsDto;
import com.combatti.settings.web.dto.UpdateSettingsRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class SettingsService {

    private final TenantSettingsRepository repository;

    public SettingsService(TenantSettingsRepository repository) {
        this.repository = repository;
    }

    /** Devuelve la configuración del tenant, creándola con valores por defecto si no existe. */
    @Transactional
    public SettingsDto getOrCreate(String tenantId) {
        TenantSettings settings = repository.findByTenantId(tenantId)
                .orElseGet(() -> repository.save(new TenantSettings(tenantId)));
        return toDto(settings);
    }

    @Transactional
    public SettingsDto update(String tenantId, String user, UpdateSettingsRequest request) {
        TenantSettings settings = repository.findByTenantId(tenantId)
                .orElseGet(() -> new TenantSettings(tenantId));

        settings.setRestaurantName(request.restaurantName().trim());
        settings.setTaxId(blankToNull(request.taxId()));
        settings.setAddress(blankToNull(request.address()));
        settings.setPhone(blankToNull(request.phone()));
        settings.setEmail(blankToNull(request.email()));
        settings.setCurrency(request.currency().trim().toUpperCase());
        settings.setTaxRatePercent(orZero(request.taxRatePercent()));
        settings.setServiceChargePercent(orZero(request.serviceChargePercent()));
        settings.setTipSuggestedPercent(orZero(request.tipSuggestedPercent()));
        settings.setReceiptFooter(blankToNull(request.receiptFooter()));
        settings.setPrinterTransport(normalizeTransport(request.printerTransport()));
        settings.setReceiptPrinterHost(blankToNull(request.receiptPrinterHost()));
        settings.setReceiptPrinterPort(request.receiptPrinterPort());
        settings.setKitchenPrinterHost(blankToNull(request.kitchenPrinterHost()));
        settings.setKitchenPrinterPort(request.kitchenPrinterPort());
        settings.touch(user);

        return toDto(repository.save(settings));
    }

    private String normalizeTransport(String transport) {
        if (transport == null || transport.isBlank()) {
            return "noop";
        }
        String value = transport.trim().toLowerCase();
        if (!value.equals("noop") && !value.equals("network")) {
            throw new BadRequestException("Transporte de impresión inválido: usa 'noop' o 'network'.");
        }
        return value;
    }

    private BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private SettingsDto toDto(TenantSettings s) {
        return new SettingsDto(
                s.getRestaurantName(),
                s.getTaxId(),
                s.getAddress(),
                s.getPhone(),
                s.getEmail(),
                s.getCurrency(),
                s.getTaxRatePercent(),
                s.getServiceChargePercent(),
                s.getTipSuggestedPercent(),
                s.getReceiptFooter(),
                s.getPrinterTransport(),
                s.getReceiptPrinterHost(),
                s.getReceiptPrinterPort(),
                s.getKitchenPrinterHost(),
                s.getKitchenPrinterPort(),
                s.getUpdatedBy(),
                s.getUpdatedAt()
        );
    }
}
