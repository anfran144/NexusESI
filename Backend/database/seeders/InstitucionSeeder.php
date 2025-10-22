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
        // Instituciones de ejemplo organizadas por ciudad
        $instituciones = [
            // Bogotá
            'Bogotá' => [
                ['nombre' => 'Universidad Nacional de Colombia', 'identificador' => 'UNAL-BOG-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad de los Andes', 'identificador' => 'UNIANDES-001', 'estado' => 'activo'],
                ['nombre' => 'Pontificia Universidad Javeriana', 'identificador' => 'PUJ-BOG-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad Externado de Colombia', 'identificador' => 'UEC-001', 'estado' => 'activo'],
                ['nombre' => 'Hospital San Ignacio', 'identificador' => 'HSI-BOG-001', 'estado' => 'activo'],
                ['nombre' => 'Clínica Fundación Santa Fe', 'identificador' => 'CFSF-001', 'estado' => 'activo'],
                ['nombre' => 'Instituto Colombiano de Bienestar Familiar', 'identificador' => 'ICBF-BOG-001', 'estado' => 'activo'],
            ],
            // Medellín
            'Medellín' => [
                ['nombre' => 'Universidad de Antioquia', 'identificador' => 'UDEA-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad EAFIT', 'identificador' => 'EAFIT-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad Pontificia Bolivariana', 'identificador' => 'UPB-MED-001', 'estado' => 'activo'],
                ['nombre' => 'Hospital Pablo Tobón Uribe', 'identificador' => 'HPTU-001', 'estado' => 'activo'],
                ['nombre' => 'Clínica Las Américas', 'identificador' => 'CLA-001', 'estado' => 'activo'],
                ['nombre' => 'EPM - Empresas Públicas de Medellín', 'identificador' => 'EPM-001', 'estado' => 'activo'],
            ],
            // Cali
            'Cali' => [
                ['nombre' => 'Universidad del Valle', 'identificador' => 'UNIVALLE-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad Icesi', 'identificador' => 'ICESI-001', 'estado' => 'activo'],
                ['nombre' => 'Pontificia Universidad Javeriana Cali', 'identificador' => 'PUJ-CALI-001', 'estado' => 'activo'],
                ['nombre' => 'Hospital Universitario del Valle', 'identificador' => 'HUV-001', 'estado' => 'activo'],
                ['nombre' => 'Fundación Valle del Lili', 'identificador' => 'FVL-001', 'estado' => 'activo'],
            ],
            // Barranquilla
            'Barranquilla' => [
                ['nombre' => 'Universidad del Norte', 'identificador' => 'UNINORTE-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad del Atlántico', 'identificador' => 'UATLANTICO-001', 'estado' => 'activo'],
                ['nombre' => 'Clínica General del Norte', 'identificador' => 'CGN-001', 'estado' => 'activo'],
                ['nombre' => 'Hospital Universidad del Norte', 'identificador' => 'HUN-001', 'estado' => 'activo'],
            ],
            // Cartagena
            'Cartagena' => [
                ['nombre' => 'Universidad de Cartagena', 'identificador' => 'UNICARTAGENA-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad Tecnológica de Bolívar', 'identificador' => 'UTB-001', 'estado' => 'activo'],
                ['nombre' => 'Hospital Naval de Cartagena', 'identificador' => 'HNC-001', 'estado' => 'activo'],
            ],
            // Bucaramanga
            'Bucaramanga' => [
                ['nombre' => 'Universidad Industrial de Santander', 'identificador' => 'UIS-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad Pontificia Bolivariana Bucaramanga', 'identificador' => 'UPB-BUC-001', 'estado' => 'activo'],
                ['nombre' => 'Fundación Cardiovascular de Colombia', 'identificador' => 'FCV-001', 'estado' => 'activo'],
            ],
            // Manizales
            'Manizales' => [
                ['nombre' => 'Universidad Nacional de Colombia Manizales', 'identificador' => 'UNAL-MAN-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad de Caldas', 'identificador' => 'UCALDAS-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad de Manizales', 'identificador' => 'UDM-001', 'estado' => 'activo'],
            ],
            // Pereira
            'Pereira' => [
                ['nombre' => 'Universidad Tecnológica de Pereira', 'identificador' => 'UTP-001', 'estado' => 'activo'],
                ['nombre' => 'Universidad Católica Luis Amigó', 'identificador' => 'UCLA-PER-001', 'estado' => 'activo'],
                ['nombre' => 'Hospital San Jorge', 'identificador' => 'HSJ-PER-001', 'estado' => 'activo'],
            ],
        ];

        $totalInstituciones = 0;

        foreach ($instituciones as $nombreCiudad => $institucionesCiudad) {
            // Buscar la ciudad
            $ciudad = Ciudad::where('nombre', $nombreCiudad)->first();

            if (! $ciudad) {
                Log::warning("Ciudad no encontrada: {$nombreCiudad}");

                continue;
            }

            $contadorCiudad = 0;
            foreach ($institucionesCiudad as $institucionData) {
                $institucion = Institucion::firstOrCreate(
                    ['identificador' => $institucionData['identificador']],
                    [
                        'nombre' => $institucionData['nombre'],
                        'estado' => $institucionData['estado'],
                        'ciudad_id' => $ciudad->id,
                    ]
                );

                if ($institucion->wasRecentlyCreated) {
                    $contadorCiudad++;
                    $totalInstituciones++;
                }
            }

            if ($contadorCiudad > 0) {
                Log::info("Creadas {$contadorCiudad} instituciones en {$nombreCiudad}");
            }
        }

        Log::info("InstitucionSeeder completado. Total de instituciones creadas: {$totalInstituciones}");
    }
}
