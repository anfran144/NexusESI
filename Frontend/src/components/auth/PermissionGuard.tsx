import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { usePermissions } from '@/hooks/usePermissions';
import { Loader2, ShieldX } from 'lucide-react';

interface PermissionGuardProps {
    children: ReactNode;
    /** Permiso específico requerido */
    permission?: string;
    /** Array de permisos, el usuario debe tener al menos uno */
    anyPermissions?: string[];
    /** Array de permisos, el usuario debe tener todos */
    allPermissions?: string[];
    /** Componente personalizado para mostrar cuando no hay permisos */
    fallbackComponent?: ReactNode;
}

/**
 * Componente que protege rutas basado en permisos del usuario
 * 
 * @example
 * // Proteger una ruta con un permiso específico
 * <PermissionGuard permission="admin.users.view">
 *   <UsersPage />
 * </PermissionGuard>
 * 
 * @example
 * // Proteger con múltiples permisos (cualquiera)
 * <PermissionGuard anyPermissions={['admin.dashboard.view', 'coordinator.dashboard.view']}>
 *   <DashboardPage />
 * </PermissionGuard>
 */
export function PermissionGuard({
    children,
    permission,
    anyPermissions,
    allPermissions,
    fallbackComponent,
}: PermissionGuardProps) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    // Mostrar loading mientras se verifica la autenticación
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Si no está autenticado, mostrar página de acceso denegado
    if (!isAuthenticated || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                    <ShieldX className="h-16 w-16 text-destructive" />
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                        <p className="text-muted-foreground">
                            Debes iniciar sesión para acceder a esta página.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Determinar si el usuario tiene los permisos necesarios
    let hasAccess = true;

    if (permission) {
        hasAccess = hasPermission(permission);
    } else if (anyPermissions && anyPermissions.length > 0) {
        hasAccess = hasAnyPermission(anyPermissions);
    } else if (allPermissions && allPermissions.length > 0) {
        hasAccess = hasAllPermissions(allPermissions);
    }

    // Si tiene acceso, mostrar el contenido
    if (hasAccess) {
        return <>{children}</>;
    }

    // Si hay un componente fallback personalizado, mostrarlo
    if (fallbackComponent) {
        return <>{fallbackComponent}</>;
    }

    // Mostrar página de acceso denegado por defecto
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <ShieldX className="h-16 w-16 text-destructive" />
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Acceso Denegado</h1>
                    <p className="text-muted-foreground">
                        No tienes los permisos necesarios para acceder a esta página.
                    </p>
                </div>
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Volver
                </button>
            </div>
        </div>
    );
}