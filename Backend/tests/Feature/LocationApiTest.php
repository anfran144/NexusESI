<?php

namespace Tests\Feature;

use App\Models\Ciudad;
use App\Models\Estado;
use App\Models\Pais;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear datos de prueba
        $this->createTestData();
    }

    private function createTestData()
    {
        // Crear país
        $pais = Pais::create([
            'nombre' => 'Colombia',
            'codigo_iso' => 'COL',
        ]);

        // Crear estados
        $antioquia = Estado::create([
            'nombre' => 'Antioquia',
            'pais_id' => $pais->id,
        ]);

        $cundinamarca = Estado::create([
            'nombre' => 'Cundinamarca',
            'pais_id' => $pais->id,
        ]);

        // Crear ciudades
        Ciudad::create([
            'nombre' => 'Medellín',
            'estado_id' => $antioquia->id,
        ]);

        Ciudad::create([
            'nombre' => 'Envigado',
            'estado_id' => $antioquia->id,
        ]);

        Ciudad::create([
            'nombre' => 'Bogotá',
            'estado_id' => $cundinamarca->id,
        ]);
    }

    public function test_can_get_all_countries()
    {
        $response = $this->getJson('/api/locations/paises');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'nombre',
                        'codigo_iso',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Países obtenidos exitosamente',
            ]);

        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('Colombia', $response->json('data.0.nombre'));
    }

    public function test_can_get_states_by_country()
    {
        $pais = Pais::first();

        $response = $this->getJson("/api/locations/estados/{$pais->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'nombre',
                        'pais_id',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'pais' => [
                    'id',
                    'nombre',
                    'codigo_iso',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Estados obtenidos exitosamente',
            ]);

        $this->assertEquals(2, count($response->json('data')));
    }

    public function test_can_get_cities_by_state()
    {
        $estado = Estado::where('nombre', 'Antioquia')->first();

        $response = $this->getJson("/api/locations/ciudades/estado/{$estado->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'nombre',
                        'estado_id',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'estado' => [
                    'id',
                    'nombre',
                    'pais_id',
                    'pais',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Ciudades obtenidas exitosamente',
            ]);

        $this->assertEquals(2, count($response->json('data')));
    }

    public function test_can_get_cities_by_country()
    {
        $pais = Pais::first();

        $response = $this->getJson("/api/locations/ciudades/pais/{$pais->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'nombre',
                        'estado_id',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'pais' => [
                    'id',
                    'nombre',
                    'codigo_iso',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Ciudades obtenidas exitosamente',
            ]);

        $this->assertEquals(3, count($response->json('data')));
    }

    public function test_can_get_hierarchical_structure()
    {
        $response = $this->getJson('/api/locations/hierarchy');

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
                                'pais_id',
                                'ciudades' => [
                                    '*' => [
                                        'id',
                                        'nombre',
                                        'estado_id',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Estructura jerárquica completa obtenida exitosamente',
            ]);
    }

    public function test_can_get_hierarchical_structure_by_country()
    {
        $pais = Pais::first();

        $response = $this->getJson("/api/locations/hierarchy/{$pais->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'nombre',
                    'codigo_iso',
                    'estados' => [
                        '*' => [
                            'id',
                            'nombre',
                            'pais_id',
                            'ciudades' => [
                                '*' => [
                                    'id',
                                    'nombre',
                                    'estado_id',
                                ],
                            ],
                        ],
                    ],
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Estructura jerárquica obtenida exitosamente',
            ]);
    }

    public function test_can_search_locations()
    {
        $response = $this->getJson('/api/locations/search?q=Med');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'paises',
                    'estados',
                    'ciudades',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Búsqueda completada exitosamente',
            ]);

        // Verificar que encontró Medellín
        $ciudades = $response->json('data.ciudades');
        $this->assertGreaterThan(0, count($ciudades));
        $this->assertEquals('Medellín', $ciudades[0]['nombre']);
    }

    public function test_search_requires_minimum_characters()
    {
        $response = $this->getJson('/api/locations/search?q=M');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'El término de búsqueda debe tener al menos 2 caracteres',
            ]);
    }

    public function test_returns_404_for_nonexistent_country()
    {
        $response = $this->getJson('/api/locations/estados/999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'País no encontrado',
            ]);
    }

    public function test_returns_404_for_nonexistent_state()
    {
        $response = $this->getJson('/api/locations/ciudades/estado/999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Estado no encontrado',
            ]);
    }
}
