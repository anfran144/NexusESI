<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar caché de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Definir todos los permisos granulares del sistema
        $permissions = [
            // Dashboard permissions
            'dashboard.view',

            // Admin permissions
            'admin.dashboard.view',
            'admin.institutions.view',
            'admin.institutions.create',
            'admin.institutions.edit',
            'admin.institutions.delete',
            'admin.users.view',
            'admin.users.create',
            'admin.users.edit',
            'admin.users.delete',
            'admin.roles.manage',
            'admin.system.configure',

            // Coordinator permissions
            'coordinator.dashboard.view',
            'coordinator.seedbeds.view',
            'coordinator.seedbeds.create',
            'coordinator.seedbeds.edit',
            'coordinator.seedbeds.delete',
            'coordinator.projects.view',
            'coordinator.projects.assign',
            'coordinator.reports.view',

            // Events permissions
            'events.view',
            'events.create',
            'events.edit',
            'events.delete',
            'events.manage_participants',
            'events.participate',
            'events.committees.manage',

            // Tasks permissions (legacy - mantener para compatibilidad)
            'tasks.view',           // @deprecated Use events.tasks.view
            'tasks.create',         // @deprecated Use events.tasks.manage
            'tasks.update',         // @deprecated Use events.tasks.manage
            'tasks.delete',         // @deprecated Use events.tasks.manage
            'tasks.assign',         // @deprecated Use events.tasks.assign
            'tasks.complete',       // @deprecated Use events.tasks.complete
            'tasks.report_progress', // @deprecated Use events.tasks.report_progress

            // Event-specific Task permissions (new - preferred)
            'events.tasks.view',          // Ver tareas del evento
            'events.tasks.manage',        // CRUD completo de tareas (coordinador)
            'events.tasks.assign',        // Asignar tareas a miembros
            'events.tasks.view_assigned', // Ver tareas asignadas (líder)
            'events.tasks.complete',      // Completar tareas propias
            'events.tasks.report_progress', // Reportar progreso en tareas

            // Incidents permissions (legacy - mantener para compatibilidad)
            'incidents.view',       // @deprecated Use events.incidents.view
            'incidents.create',     // @deprecated Use events.incidents.report
            'incidents.resolve',    // @deprecated Use events.incidents.resolve

            // Event-specific Incident permissions (new - preferred)
            'events.incidents.view',    // Ver incidencias del evento
            'events.incidents.report',  // Reportar incidencias (líder)
            'events.incidents.resolve', // Resolver incidencias (coordinador)

            // Alerts permissions (legacy - mantener para compatibilidad)
            'alerts.view',          // @deprecated Use events.alerts.view
            'alerts.manage',        // @deprecated Use events.alerts.manage

            // Event-specific Alert permissions (new - preferred)
            'events.alerts.view',   // Ver alertas del evento
            'events.alerts.manage', // Gestionar alertas (coordinador)

            // Seedbed Leader permissions
            'seedbed_leader.dashboard.view',
            'seedbed_leader.seedbed.view',
            'seedbed_leader.seedbed.edit',
            'seedbed_leader.projects.view',
            'seedbed_leader.projects.create',
            'seedbed_leader.projects.edit',
            'seedbed_leader.projects.delete',
            'seedbed_leader.members.manage',

            // Shared permissions
            'profile.view',
            'profile.edit',
            'notifications.view',

            // Cache permissions (for performance optimization)
            'cache.clear',
            'cache.view',
        ];

        // Crear permisos
        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'api',
            ]);
        }

        $this->command->info('✅ Permisos creados exitosamente: '.count($permissions).' permisos.');

        // Asignar permisos a los roles después de crearlos
        $this->assignPermissionsToRoles();
    }

    /**
     * Asignar permisos específicos a cada rol
     */
    private function assignPermissionsToRoles(): void
    {
        // Admin: Acceso completo a todo el sistema
        $adminRole = \Spatie\Permission\Models\Role::findByName('admin', 'api');
        $adminRole->givePermissionTo([
            'dashboard.view',
            'admin.dashboard.view',
            'admin.institutions.view',
            'admin.institutions.create',
            'admin.institutions.edit',
            'admin.institutions.delete',
            'admin.users.view',
            'admin.users.create',
            'admin.users.edit',
            'admin.users.delete',
            'admin.roles.manage',
            'admin.system.configure',
            // Admin NO tiene permisos de eventos - son gestionados por coordinadores
            'profile.view',
            'profile.edit',
            'notifications.view',
            'cache.clear',
            'cache.view',
        ]);

        // Coordinator: Gestión de semilleros y supervisión de proyectos
        $coordinatorRole = \Spatie\Permission\Models\Role::findByName('coordinator', 'api');
        $coordinatorRole->givePermissionTo([
            'dashboard.view',
            'coordinator.dashboard.view',
            'coordinator.seedbeds.view',
            'coordinator.seedbeds.create',
            'coordinator.seedbeds.edit',
            'coordinator.seedbeds.delete',
            'coordinator.projects.view',
            'coordinator.projects.assign',
            'coordinator.reports.view',
            'events.view',
            'events.create',
            'events.edit',
            'events.delete',
            'events.manage_participants',
            'events.committees.manage',
            // Legacy task permissions (mantener para compatibilidad)
            'tasks.view',
            'tasks.create',
            'tasks.update',
            'tasks.delete',
            'tasks.assign',
            // New event-specific task permissions (preferred)
            'events.tasks.view',
            'events.tasks.manage',
            'events.tasks.assign',
            // Legacy incident permissions (mantener para compatibilidad)
            'incidents.view',
            'incidents.resolve',
            // New event-specific incident permissions (preferred)
            'events.incidents.view',
            'events.incidents.resolve',
            // Legacy alert permissions (mantener para compatibilidad)
            'alerts.view',
            'alerts.manage',
            // New event-specific alert permissions (preferred)
            'events.alerts.view',
            'events.alerts.manage',
            'profile.view',
            'profile.edit',
            'notifications.view',
        ]);

        // Seedbed Leader: Gestión de su semillero y proyectos
        $seedbedLeaderRole = \Spatie\Permission\Models\Role::findByName('seedbed_leader', 'api');
        $seedbedLeaderRole->givePermissionTo([
            'dashboard.view',
            'seedbed_leader.dashboard.view',
            'seedbed_leader.seedbed.view',
            'seedbed_leader.seedbed.edit',
            'seedbed_leader.projects.view',
            'seedbed_leader.projects.create',
            'seedbed_leader.projects.edit',
            'seedbed_leader.projects.delete',
            'seedbed_leader.members.manage',
            'events.view',
            'events.participate',
            // Legacy task permissions (mantener para compatibilidad)
            'tasks.view',
            'tasks.complete',
            'tasks.report_progress',
            // New event-specific task permissions (preferred)
            'events.tasks.view',
            'events.tasks.view_assigned',
            'events.tasks.complete',
            'events.tasks.report_progress',
            // Legacy incident permissions (mantener para compatibilidad)
            'incidents.view',
            'incidents.create',
            // New event-specific incident permissions (preferred)
            'events.incidents.view',
            'events.incidents.report',
            // Legacy alert permissions (mantener para compatibilidad)
            'alerts.view',
            // New event-specific alert permissions (preferred)
            'events.alerts.view',
            'profile.view',
            'profile.edit',
            'notifications.view',
        ]);

        $this->command->info('✅ Permisos asignados a los roles exitosamente.');
    }
}
