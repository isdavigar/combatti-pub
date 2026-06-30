package com.combatti.integration.domain;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Scopes disponibles para las API keys de integración.
 * Se conceden a clientes externos (e-commerce, pasarelas) de forma granular.
 */
public final class ApiScope {

    public static final String CATALOG_READ = "catalog:read";
    public static final String ORDERS_READ = "orders:read";
    public static final String ORDERS_WRITE = "orders:write";

    private static final Set<String> ALL = new LinkedHashSet<>(Set.of(
            CATALOG_READ, ORDERS_READ, ORDERS_WRITE));

    private ApiScope() {
    }

    public static boolean isValid(String scope) {
        return scope != null && ALL.contains(scope.trim());
    }

    public static Set<String> all() {
        return Set.copyOf(ALL);
    }
}
