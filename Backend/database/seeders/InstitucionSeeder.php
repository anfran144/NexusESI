<?php

namespace Database\Seeders;

use App\Models\Ciudad;
use App\Models\Institucion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class InstitucionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Eliminar todas las instituciones existentes
        Institucion::query()->delete();
        Log::info('Instituciones existentes eliminadas.');

        // Buscar la ciudad de Pasto
        $ciudadPasto = Ciudad::where('nombre', 'Pasto')->first();

        if (!$ciudadPasto) {
            Log::warning("Ciudad 'Pasto' no encontrada. Asegúrate de ejecutar CiudadSeeder primero.");
            $this->command->error("Ciudad 'Pasto' no encontrada. Ejecuta primero CiudadSeeder.");
            return;
        }

        // Crear solo Universidad Mariana en Pasto, Nariño
        $universidadMariana = Institucion::create([
            'nombre' => 'Universidad Mariana',
            'identificador' => 'UMARIANA-PASTO-001',
            'estado' => 'activo',
            'ciudad_id' => $ciudadPasto->id,
        ]);

        Log::info("Institución 'Universidad Mariana' creada en Pasto, Nariño.");
        $this->command->info("Institución 'Universidad Mariana' creada exitosamente en Pasto, Nariño.");
    }
}
