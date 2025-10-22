<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ejecutar seeders en orden correcto
        $this->call([
            // Primero crear roles (sin asignar permisos aún)
            RoleSeeder::class,
            // Luego crear permisos
            PermissionSeeder::class,
            // Después crear usuarios
            UserSeeder::class,
        ]);

        // Ejecutar seeders de estructura geográfica
        $this->call([
            PaisSeeder::class,
            EstadoSeeder::class,
            CiudadSeeder::class,
            InstitucionSeeder::class,
            EventSeeder::class,
        ]);
    }
}
