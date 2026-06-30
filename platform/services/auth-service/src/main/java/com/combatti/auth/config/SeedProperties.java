package com.combatti.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades del usuario administrador inicial ({@code combatti.seed.*}).
 */
@ConfigurationProperties(prefix = "combatti.seed")
public class SeedProperties {

    private String adminUsername = "admin";
    private String adminPassword = "admin123";
    private String adminDisplayName = "Administrador";
    private String tenantId = "default";

    public String getAdminUsername() {
        return adminUsername;
    }

    public void setAdminUsername(String adminUsername) {
        this.adminUsername = adminUsername;
    }

    public String getAdminPassword() {
        return adminPassword;
    }

    public void setAdminPassword(String adminPassword) {
        this.adminPassword = adminPassword;
    }

    public String getAdminDisplayName() {
        return adminDisplayName;
    }

    public void setAdminDisplayName(String adminDisplayName) {
        this.adminDisplayName = adminDisplayName;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}
