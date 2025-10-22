<?php

namespace Database\Seeders;

use App\Models\Pais;
use Illuminate\Database\Seeder;

class PaisSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear Colombia como país principal
        Pais::firstOrCreate(
            ['codigo_iso' => 'COL'],
            [
                'nombre' => 'Colombia',
                'codigo_iso' => 'COL',
            ]
        );

        $this->command->info('País Colombia creado exitosamente.');
    }
}
