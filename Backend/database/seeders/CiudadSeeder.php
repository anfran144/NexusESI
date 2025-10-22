<?php

namespace Database\Seeders;

use App\Models\Ciudad;
use App\Models\Estado;
use App\Models\Pais;
use Illuminate\Database\Seeder;

class CiudadSeeder extends Seeder
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

        // Ciudades principales por departamento
        $ciudadesPorDepartamento = [
            'Antioquia' => ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo'],
            'Atlántico' => ['Barranquilla', 'Soledad', 'Malambo', 'Sabanagrande'],
            'Bogotá D.C.' => ['Bogotá'],
            'Bolívar' => ['Cartagena', 'Magangué', 'Turbaco', 'Arjona'],
            'Boyacá' => ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá'],
            'Caldas' => ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría'],
            'Cauca' => ['Popayán', 'Santander de Quilichao', 'Puerto Tejada'],
            'Cesar' => ['Valledupar', 'Aguachica', 'Bosconia', 'Codazzi'],
            'Córdoba' => ['Montería', 'Lorica', 'Cereté', 'Sahagún'],
            'Cundinamarca' => ['Soacha', 'Girardot', 'Zipaquirá', 'Chía', 'Facatativá', 'Fusagasugá'],
            'Huila' => ['Neiva', 'Pitalito', 'Garzón', 'La Plata'],
            'La Guajira' => ['Riohacha', 'Maicao', 'Fonseca', 'San Juan del Cesar'],
            'Magdalena' => ['Santa Marta', 'Ciénaga', 'Fundación', 'Plato'],
            'Meta' => ['Villavicencio', 'Acacías', 'Granada', 'Puerto López'],
            'Nariño' => ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres'],
            'Norte de Santander' => ['Cúcuta', 'Ocaña', 'Pamplona', 'Villa del Rosario'],
            'Quindío' => ['Armenia', 'Calarcá', 'Montenegro', 'La Tebaida'],
            'Risaralda' => ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia'],
            'Santander' => ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja'],
            'Sucre' => ['Sincelejo', 'Corozal', 'Sampués', 'San Marcos'],
            'Tolima' => ['Ibagué', 'Espinal', 'Melgar', 'Honda'],
            'Valle del Cauca' => ['Cali', 'Palmira', 'Buenaventura', 'Cartago', 'Tuluá', 'Buga'],
            'Casanare' => ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena'],
            'Caquetá' => ['Florencia', 'San Vicente del Caguán', 'Puerto Rico'],
            'Putumayo' => ['Mocoa', 'Puerto Asís', 'Orito'],
            'Arauca' => ['Arauca', 'Saravena', 'Fortul'],
            'Amazonas' => ['Leticia', 'Puerto Nariño'],
            'Guainía' => ['Inírida'],
            'Guaviare' => ['San José del Guaviare'],
            'Vaupés' => ['Mitú'],
            'Vichada' => ['Puerto Carreño'],
            'San Andrés y Providencia' => ['San Andrés', 'Providencia'],
            'Chocó' => ['Quibdó', 'Istmina', 'Condoto'],
        ];

        $totalCiudades = 0;

        foreach ($ciudadesPorDepartamento as $nombreDepartamento => $ciudades) {
            // Buscar el departamento
            $departamento = Estado::where('nombre', $nombreDepartamento)
                ->where('pais_id', $colombia->id)
                ->first();

            if (! $departamento) {
                $this->command->warn("Departamento '{$nombreDepartamento}' no encontrado.");

                continue;
            }

            // Crear las ciudades del departamento
            foreach ($ciudades as $nombreCiudad) {
                Ciudad::firstOrCreate(
                    [
                        'nombre' => $nombreCiudad,
                        'estado_id' => $departamento->id,
                    ],
                    [
                        'nombre' => $nombreCiudad,
                        'estado_id' => $departamento->id,
                    ]
                );
                $totalCiudades++;
            }

            $this->command->info("Ciudades creadas para {$nombreDepartamento}: ".count($ciudades));
        }

        $this->command->info("Total de ciudades creadas: {$totalCiudades}");
    }
}
