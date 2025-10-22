import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook personalizado para gestionar permisos de usuario
 * Centraliza toda la lógica de verificación de permisos en la aplicación
 */
export const usePermissions = () => {
    const { user } = useAuthStore();
    const permissions = user?.permissions || [];

    /**
     * Verifica si el usuario tiene un permiso específico
     * @param permission - Nombre del permiso a verificar
     * @returns true si el usuario tiene el permiso, false en caso contrario
     */
    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    /**
     * Verifica si el usuario tiene al menos uno de los permisos requeridos
     * @param requiredPermissions - Array de permisos requeridos
     * @returns true si el usuario tiene al menos uno de los permisos, false en caso contrario
     */
    const hasAnyPermission = (requiredPermissions: string[]): boolean => {
        return requiredPermissions.some(permission => permissions.includes(permission));
    };

    /**
     * Verifica si el usuario tiene todos los permisos requeridos
     * @param requiredPermissions - Array de permisos requeridos
     * @returns true si el usuario tiene todos los permisos, false en caso contrario
     */
    const hasAllPermissions = (requiredPermissions: string[]): boolean => {
        return requiredPermissions.every(permission => permissions.includes(permission));
    };

    /**
     * Hook personalizado para verificar permisos específicos
     * Útil para casos donde necesitas verificar un permiso específico frecuentemente
     * @param permission - Permiso a verificar
     * @returns true si el usuario tiene el permiso
     */
    const useCan = (permission: string): boolean => {
        return hasPermission(permission);
    };

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        useCan,
    };
};