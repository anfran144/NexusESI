<?php

namespace Tests\Feature;

use App\Models\Ciudad;
use App\Models\Estado;
use App\Models\Institucion;
use App\Models\Pais;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstitucionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear datos de prueba
        $pais = Pais::create([
            'nombre' => 'Colombia',
            'codigo_iso' => 'COL',
        ]);

        $estado = Estado::create([
            'nombre' => 'Cundinamarca',
            'pais_id' => $pais->id,
        ]);

        $ciudad = Ciudad::create([
            'nombre' => 'Bogotá',
            'estado_id' => $estado->id,
        ]);

        // Crear instituciones de prueba
        Institucion::create([
            'nombre' => 'Universidad Nacional de Colombia',
            'identificador' => 'UNAL-TEST-001',
            'estado' => 'activo',
            'ciudad_id' => $ciudad->id,
        ]);

        Institucion::create([
            'nombre' => 'Universidad de los Andes',
            'identificador' => 'UNIANDES-TEST-001',
            'estado' => 'activo',
            'ciudad_id' => $ciudad->id,
        ]);

        Institucion::create([
            'nombre' => 'Hospital San Ignacio',
            'identificador' => 'HSI-TEST-001',
            'estado' => 'inactivo',
            'ciudad_id' => $ciudad->id,
        ]);
    }

    public function test_can_get_all_institutions()
    {
        $response = $this->getJson('/api/institutions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'nombre',
                        'identificador',
                        'estado',
                        'ciudad_id',
                        'ciudad' => [
                            'id',
                            'nombre',
                            'estado' => [
                                'id',
                                'nombre',
                                'pais' => [
                                    'id',
                                    'nombre',
                                    'codigo_iso',
                                ],
                            ],
                        ],
                    ],
                ],
                'pagination',
            ]);

        // Solo debe devolver instituciones activas
        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Verificar que todas las instituciones devueltas están activas
        foreach ($data as $institucion) {
            $this->assertEquals('activo', $institucion['estado']);
        }
    }

    public function test_can_get_institution_by_id()
    {
        $institucion = Institucion::where('estado', 'activo')->first();

        $response = $this->getJson("/api/institutions/{$institucion->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'nombre',
                    'identificador',
                    'estado',
                    'ciudad_id',
                    'ciudad',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $institucion->id,
                    'nombre' => $institucion->nombre,
                    'identificador' => $institucion->identificador,
                ],
            ]);
    }

    public function test_returns_404_for_nonexistent_institution()
    {
        $response = $this->getJson('/api/institutions/999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Institución no encontrada',
            ]);
    }

    public function test_can_get_institutions_by_city()
    {
        $ciudad = Ciudad::first();

        $response = $this->getJson("/api/institutions/city/{$ciudad->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'ciudad',
                'total',
            ])
            ->assertJson([
                'success' => true,
                'total' => 2, // Solo instituciones activas
            ]);
    }

    public function test_can_get_institutions_by_state()
    {
        $estado = Estado::first();

        $response = $this->getJson("/api/institutions/state/{$estado->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'estado',
                'total',
            ])
            ->assertJson([
                'success' => true,
                'total' => 2,
            ]);
    }

    public function test_can_get_institutions_by_country()
    {
        $pais = Pais::first();

        $response = $this->getJson("/api/institutions/country/{$pais->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'pais',
                'total',
            ])
            ->assertJson([
                'success' => true,
                'total' => 2,
            ]);
    }

    public function test_can_search_institutions()
    {
        $response = $this->getJson('/api/institutions/search/query?q=Universidad');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'termino',
                'total',
            ])
            ->assertJson([
                'success' => true,
                'termino' => 'Universidad',
            ]);

        $data = $response->json('data');
        $this->assertGreaterThan(0, count($data));

        // Verificar que los resultados contienen el término buscado
        foreach ($data as $institucion) {
            $this->assertStringContainsStringIgnoringCase('Universidad', $institucion['nombre']);
        }
    }

    public function test_search_requires_minimum_characters()
    {
        $response = $this->getJson('/api/institutions/search/query?q=U');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'El término de búsqueda debe tener al menos 2 caracteres',
            ]);
    }

    public function test_can_get_hierarchical_structure()
    {
        $response = $this->getJson('/api/institutions/hierarchy/structure');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'nombre',
                        'codigo_iso',
                        'estados' => [
                            '*' => [
                                'id',
                                'nombre',
                                'ciudades' => [
                                    '*' => [
                                        'id',
                                        'nombre',
                                        'instituciones' => [
                                            '*' => [
                                                'id',
                                                'nombre',
                                                'identificador',
                                                'estado',
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ]);
    }

    public function test_can_get_statistics()
    {
        $response = $this->getJson('/api/institutions/statistics/overview');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_instituciones',
                    'instituciones_activas',
                    'instituciones_inactivas',
                    'por_pais',
                    'por_estado',
                    'por_ciudad',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_instituciones' => 3,
                    'instituciones_activas' => 2,
                    'instituciones_inactivas' => 1,
                ],
            ]);
    }

    public function test_returns_404_for_nonexistent_city()
    {
        $response = $this->getJson('/api/institutions/city/999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Ciudad no encontrada',
            ]);
    }

    public function test_returns_404_for_nonexistent_state()
    {
        $response = $this->getJson('/api/institutions/state/999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Estado no encontrado',
            ]);
    }

    public function test_returns_404_for_nonexistent_country()
    {
        $response = $this->getJson('/api/institutions/country/999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'País no encontrado',
            ]);
    }
}
