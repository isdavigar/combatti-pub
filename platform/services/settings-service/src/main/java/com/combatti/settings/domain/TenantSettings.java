package com.combatti.settings.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * Configuración del negocio por tenant. Existe una sola fila por tenant
 * (tenant_id es único); si no existe se crea con valores por defecto.
 */
@Entity
@Table(name = "tenant_settings")
public class TenantSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false, unique = true, length = 64)
    private String tenantId;

    // --- Datos del negocio ---
    @Column(name = "restaurant_name", nullable = false, length = 160)
    private String restaurantName = "Combatti";

    @Column(name = "tax_id", length = 40)
    private String taxId;

    @Column(name = "address", length = 240)
    private String address;

    @Column(name = "phone", length = 40)
    private String phone;

    @Column(name = "email", length = 120)
    private String email;

    // --- Parámetros de venta ---
    @Column(name = "currency", nullable = false, length = 8)
    private String currency = "COP";

    @Column(name = "tax_rate_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRatePercent = BigDecimal.ZERO;

    @Column(name = "service_charge_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal serviceChargePercent = BigDecimal.ZERO;

    @Column(name = "tip_suggested_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal tipSuggestedPercent = BigDecimal.TEN;

    @Column(name = "receipt_footer", length = 300)
    private String receiptFooter;

    // --- Configuración de impresión (alimenta el pos-bridge) ---
    @Column(name = "printer_transport", nullable = false, length = 16)
    private String printerTransport = "noop";

    @Column(name = "receipt_printer_host", length = 120)
    private String receiptPrinterHost;

    @Column(name = "receipt_printer_port")
    private Integer receiptPrinterPort;

    @Column(name = "kitchen_printer_host", length = 120)
    private String kitchenPrinterHost;

    @Column(name = "kitchen_printer_port")
    private Integer kitchenPrinterPort;

    @Column(name = "updated_by", length = 120)
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected TenantSettings() {
    }

    public TenantSettings(String tenantId) {
        this.tenantId = tenantId;
    }

    public Long getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getRestaurantName() {
        return restaurantName;
    }

    public void setRestaurantName(String restaurantName) {
        this.restaurantName = restaurantName;
    }

    public String getTaxId() {
        return taxId;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getTaxRatePercent() {
        return taxRatePercent;
    }

    public void setTaxRatePercent(BigDecimal taxRatePercent) {
        this.taxRatePercent = taxRatePercent;
    }

    public BigDecimal getServiceChargePercent() {
        return serviceChargePercent;
    }

    public void setServiceChargePercent(BigDecimal serviceChargePercent) {
        this.serviceChargePercent = serviceChargePercent;
    }

    public BigDecimal getTipSuggestedPercent() {
        return tipSuggestedPercent;
    }

    public void setTipSuggestedPercent(BigDecimal tipSuggestedPercent) {
        this.tipSuggestedPercent = tipSuggestedPercent;
    }

    public String getReceiptFooter() {
        return receiptFooter;
    }

    public void setReceiptFooter(String receiptFooter) {
        this.receiptFooter = receiptFooter;
    }

    public String getPrinterTransport() {
        return printerTransport;
    }

    public void setPrinterTransport(String printerTransport) {
        this.printerTransport = printerTransport;
    }

    public String getReceiptPrinterHost() {
        return receiptPrinterHost;
    }

    public void setReceiptPrinterHost(String receiptPrinterHost) {
        this.receiptPrinterHost = receiptPrinterHost;
    }

    public Integer getReceiptPrinterPort() {
        return receiptPrinterPort;
    }

    public void setReceiptPrinterPort(Integer receiptPrinterPort) {
        this.receiptPrinterPort = receiptPrinterPort;
    }

    public String getKitchenPrinterHost() {
        return kitchenPrinterHost;
    }

    public void setKitchenPrinterHost(String kitchenPrinterHost) {
        this.kitchenPrinterHost = kitchenPrinterHost;
    }

    public Integer getKitchenPrinterPort() {
        return kitchenPrinterPort;
    }

    public void setKitchenPrinterPort(Integer kitchenPrinterPort) {
        this.kitchenPrinterPort = kitchenPrinterPort;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void touch(String user) {
        this.updatedBy = user;
        this.updatedAt = Instant.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof TenantSettings that)) {
            return false;
        }
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
