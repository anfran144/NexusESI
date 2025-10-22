<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear usuario administrador
        $admin = User::firstOrCreate(
            ['email' => 'admin@nexusesi.com'],
            [
                'name' => 'Administrador del Sistema',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'status' => 'active', // Admin siempre activo
                'institution_id' => null, // Admin no pertenece a una institución específica
            ]
        );

        // Asignar rol de administrador
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole && ! $admin->hasRole('admin')) {
            $admin->assignRole($adminRole);
        }

        // Obtener una institución para los usuarios de ejemplo
        $institucion = \App\Models\Institucion::first();

        // Crear usuario coordinador
        $coordinator = User::firstOrCreate(
            ['email' => 'coordinador@nexusesi.com'],
            [
                'name' => 'María González - Coordinadora',
                'password' => Hash::make('coord123'),
                'email_verified_at' => now(),
                'status' => 'active',
                'institution_id' => $institucion?->id,
            ]
        );

        // Asignar rol de coordinador
        $coordinatorRole = Role::where('name', 'coordinator')->first();
        if ($coordinatorRole && ! $coordinator->hasRole('coordinator')) {
            $coordinator->assignRole($coordinatorRole);
        }

        // Crear usuario líder de semillero
        $seedbedLeader = User::firstOrCreate(
            ['email' => 'lider@nexusesi.com'],
            [
                'name' => 'Carlos Rodríguez - Líder de Semillero',
                'password' => Hash::make('lider123'),
                'email_verified_at' => now(),
                'status' => 'active',
                'institution_id' => $institucion?->id,
            ]
        );

        // Asignar rol de líder de semillero
        $seedbedLeaderRole = Role::where('name', 'seedbed_leader')->first();
        if ($seedbedLeaderRole && ! $seedbedLeader->hasRole('seedbed_leader')) {
            $seedbedLeader->assignRole($seedbedLeaderRole);
        }

        // Crear usuario de prueba sin rol específico
        $testUser = User::firstOrCreate(
            ['email' => 'test@nexusesi.com'],
            [
                'name' => 'Usuario de Prueba',
                'password' => Hash::make('test123'),
                'email_verified_at' => now(),
                'status' => 'pending_approval', // Usuario de prueba pendiente
                'institution_id' => $institucion?->id,
            ]
        );

        // Crear usuario coordinador pendiente de aprobación
        $pendingCoordinator = User::firstOrCreate(
            ['email' => 'coordinador.pendiente@nexusesi.com'],
            [
                'name' => 'Ana Martínez - Coordinadora Pendiente',
                'password' => Hash::make('pending123'),
                'email_verified_at' => now(),
                'status' => 'pending_approval',
                'institution_id' => $institucion?->id,
            ]
        );

        // Asignar rol de coordinador al usuario pendiente
        if ($coordinatorRole && ! $pendingCoordinator->hasRole('coordinator')) {
            $pendingCoordinator->assignRole($coordinatorRole);
        }

        // Mostrar información de los usuarios creados
        $this->command->info('Usuarios creados exitosamente:');
        $this->command->info('- Admin: admin@nexusesi.com / admin123 (Activo)');
        $this->command->info('- Coordinador: coordinador@nexusesi.com / coord123 (Activo)');
        $this->command->info('- Líder de Semillero: lider@nexusesi.com / lider123 (Activo)');
        $this->command->info('- Usuario de Prueba: test@nexusesi.com / test123 (Pendiente)');
        $this->command->info('- Coordinador Pendiente: coordinador.pendiente@nexusesi.com / pending123 (Pendiente)');
    }
}
