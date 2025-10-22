<?php

namespace Database\Seeders;

use App\Models\Estado;
use App\Models\Pais;
use Illuminate\Database\Seeder;

class EstadoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener Colombia
        $colombia = Pais::where('codigo_iso', 'COL')->first();

        if (! $colombia) {
            $this->command->error('País Colombia no encontrado. Ejecute primero PaisSeeder.');

            return;
        }

        // Departamentos de Colombia
        $departamentos = [
            'Amazonas',
            'Antioquia',
            'Arauca',
            'Atlántico',
            'Bolívar',
            'Boyacá',
            'Caldas',
            'Caquetá',
            'Casanare',
            'Cauca',
            'Cesar',
            'Chocó',
            'Córdoba',
            'Cundinamarca',
            'Guainía',
            'Guaviare',
            'Huila',
            'La Guajira',
            'Magdalena',
            'Meta',
            'Nariño',
            'Norte de Santander',
            'Putumayo',
            'Quindío',
            'Risaralda',
            'San Andrés y Providencia',
            'Santander',
            'Sucre',
            'Tolima',
            'Valle del Cauca',
            'Vaupés',
            'Vichada',
            'Bogotá D.C.',
        ];

        foreach ($departamentos as $departamento) {
            Estado::firstOrCreate(
                [
                    'nombre' => $departamento,
                    'pais_id' => $colombia->id,
                ],
                [
                    'nombre' => $departamento,
                    'pais_id' => $colombia->id,
                ]
            );
        }

        $this->command->info('Departamentos de Colombia creados exitosamente: '.count($departamentos).' departamentos.');
    }
}
