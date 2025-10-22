<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar caché de roles y permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Crear los roles del sistema
        $roles = [
            [
                'name' => 'admin',
                'guard_name' => 'api',
                'description' => 'Administrador del sistema con acceso completo',
            ],
            [
                'name' => 'coordinator',
                'guard_name' => 'api',
                'description' => 'Coordinador con acceso de supervisión',
            ],
            [
                'name' => 'seedbed_leader',
                'guard_name' => 'api',
                'description' => 'Líder de semillero con acceso de gestión',
            ],
        ];

        foreach ($roles as $roleData) {
            // Crear el rol solo si no existe
            $role = Role::firstOrCreate(
                [
                    'name' => $roleData['name'],
                    'guard_name' => $roleData['guard_name'],
                ]
            );

            // Mostrar mensaje de confirmación
            $this->command->info("Rol '{$role->name}' creado/verificado exitosamente.");
        }

        $this->command->info('Todos los roles han sido creados exitosamente.');
    }
}
