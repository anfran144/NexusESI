import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
    children: ReactNode;
    /** Permiso específico requerido */
    permission?: string;
    /** Array de permisos, el usuario debe tener al menos uno */
    anyPermissions?: string[];
    /** Array de permisos, el usuario debe tener todos */
    allPermissions?: string[];
    /** Componente a mostrar cuando no se tienen permisos */
    fallback?: ReactNode;
    /** Si es true, renderiza null en lugar del fallback cuando no hay permisos */
    hideWhenDenied?: boolean;
}

/**
 * Componente que controla la visibilidad de sus hijos basado en permisos del usuario
 * 
 * @example
 * // Mostrar solo si tiene un permiso específico
 * <PermissionGate permission="admin.users.create">
 *   <CreateUserButton />
 * </PermissionGate>
 * 
 * @example
 * // Mostrar si tiene cualquiera de los permisos
 * <PermissionGate anyPermissions={['admin.users.view', 'coordinator.users.view']}>
 *   <UsersList />
 * </PermissionGate>
 * 
 * @example
 * // Mostrar mensaje alternativo cuando no tiene permisos
 * <PermissionGate 
 *   permission="admin.reports.view"
 *   fallback={<div>No tienes permisos para ver reportes</div>}
 * >
 *   <ReportsSection />
 * </PermissionGate>
 */
export function PermissionGate({
    children,
    permission,
    anyPermissions,
    allPermissions,
    fallback = null,
    hideWhenDenied = false,
}: PermissionGateProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    // Determinar si el usuario tiene los permisos necesarios
    let hasAccess = true;

    if (permission) {
        hasAccess = hasPermission(permission);
    } else if (anyPermissions && anyPermissions.length > 0) {
        hasAccess = hasAnyPermission(anyPermissions);
    } else if (allPermissions && allPermissions.length > 0) {
        hasAccess = hasAllPermissions(allPermissions);
    }

    // Si tiene acceso, mostrar los hijos
    if (hasAccess) {
        return <>{children}</>;
    }

    // Si no tiene acceso y hideWhenDenied es true, no renderizar nada
    if (hideWhenDenied) {
        return null;
    }

    // Mostrar el fallback si está definido
    return <>{fallback}</>;
}