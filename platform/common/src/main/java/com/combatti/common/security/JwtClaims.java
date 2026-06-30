package com.combatti.common.security;

/**
 * Nombres de los <em>claims</em> personalizados usados en los tokens JWT
 * de la plataforma. Centralizados para evitar errores de tipeo entre el
 * servicio que firma (auth-service) y los que validan (gateway, etc.).
 */
public final class JwtClaims {

    private JwtClaims() {
    }

    /** Identificador numérico del usuario. */
    public static final String USER_ID = "uid";

    /** Identificador del tenant (cliente/restaurante) en modelo multi-tenant. */
    public static final String TENANT_ID = "tid";

    /** Lista de roles del usuario (p. ej. ["Administrador"]). */
    public static final String ROLES = "roles";

    /** Lista de permisos efectivos del usuario. */
    public static final String PERMISSIONS = "perms";

    /** Nombre para mostrar del usuario. */
    public static final String NAME = "name";
}
