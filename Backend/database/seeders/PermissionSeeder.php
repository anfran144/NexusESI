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
            'profile.view',
            'profile.edit',
            'notifications.view',
        ]);

        $this->command->info('✅ Permisos asignados a los roles exitosamente.');
    }
}
