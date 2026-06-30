package com.combatti.settings.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateSettingsRequest(
        @NotBlank(message = "El nombre del negocio es obligatorio")
        @Size(max = 160)
        String restaurantName,

        @Size(max = 40)
        String taxId,

        @Size(max = 240)
        String address,

        @Size(max = 40)
        String phone,

        @Email(message = "Correo inválido")
        @Size(max = 120)
        String email,

        @NotBlank(message = "La moneda es obligatoria")
        @Size(max = 8)
        String currency,

        @DecimalMin(value = "0.0", message = "El impuesto no puede ser negativo")
        @DecimalMax(value = "100.0", message = "El impuesto no puede superar 100%")
        BigDecimal taxRatePercent,

        @DecimalMin(value = "0.0", message = "El cargo por servicio no puede ser negativo")
        @DecimalMax(value = "100.0", message = "El cargo por servicio no puede superar 100%")
        BigDecimal serviceChargePercent,

        @DecimalMin(value = "0.0", message = "La propina sugerida no puede ser negativa")
        @DecimalMax(value = "100.0", message = "La propina sugerida no puede superar 100%")
        BigDecimal tipSuggestedPercent,

        @Size(max = 300)
        String receiptFooter,

        @Size(max = 16)
        String printerTransport,

        @Size(max = 120)
        String receiptPrinterHost,

        Integer receiptPrinterPort,

        @Size(max = 120)
        String kitchenPrinterHost,

        Integer kitchenPrinterPort
) {
}
