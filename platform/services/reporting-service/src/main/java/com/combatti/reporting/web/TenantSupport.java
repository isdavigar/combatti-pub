package com.combatti.reporting.web;

import com.combatti.common.security.AuthenticatedUser;
import org.springframework.util.StringUtils;

final class TenantSupport {

    private static final String DEFAULT_TENANT = "default";

    private TenantSupport() {
    }

    static String tenantOf(AuthenticatedUser user) {
        if (user != null && StringUtils.hasText(user.tenantId())) {
            return user.tenantId();
        }
        return DEFAULT_TENANT;
    }
}
