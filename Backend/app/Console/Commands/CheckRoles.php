<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class CheckRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'roles:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar los roles creados en el sistema';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Sistema de Roles NexusESI ===');
        $this->newLine();

        $roles = Role::all();

        if ($roles->isEmpty()) {
            $this->error('No se encontraron roles en el sistema.');

            return;
        }

        $this->info('Roles disponibles:');
        $this->newLine();

        $headers = ['ID', 'Nombre', 'Guard', 'Fecha de Creación'];
        $data = [];

        foreach ($roles as $role) {
            $data[] = [
                $role->id,
                $role->name,
                $role->guard_name,
                $role->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $this->table($headers, $data);

        $this->newLine();
        $this->info("Total de roles: {$roles->count()}");

        // Verificar tablas relacionadas
        $this->newLine();
        $this->info('Verificando estructura de base de datos...');

        $tables = [
            'roles',
            'permissions',
            'model_has_roles',
            'model_has_permissions',
            'role_has_permissions',
        ];

        foreach ($tables as $table) {
            if (\Schema::hasTable($table)) {
                $count = \DB::table($table)->count();
                $this->line("✓ Tabla '{$table}' existe ({$count} registros)");
            } else {
                $this->error("✗ Tabla '{$table}' no existe");
            }
        }

        $this->newLine();
        $this->info('Verificación completada exitosamente.');
    }
}
