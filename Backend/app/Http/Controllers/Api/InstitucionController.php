<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ciudad;
use App\Models\Estado;
use App\Models\Institucion;
use App\Models\Pais;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstitucionController extends Controller
{
    /**
     * Obtener todas las instituciones con paginación
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $perPage = min($perPage, 100); // Máximo 100 por página

            $instituciones = Institucion::conUbicacionCompleta()
                ->activas()
                ->orderBy('nombre')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $instituciones->items(),
                'pagination' => [
                    'current_page' => $instituciones->currentPage(),
                    'last_page' => $instituciones->lastPage(),
                    'per_page' => $instituciones->perPage(),
                    'total' => $instituciones->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las instituciones',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener instituciones por ciudad
     */
    public function porCiudad($ciudadId): JsonResponse
    {
        try {
            $ciudad = Ciudad::find($ciudadId);

            if (! $ciudad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ciudad no encontrada',
                ], 404);
            }

            $instituciones = Institucion::porCiudad($ciudadId)
                ->conUbicacionCompleta()
                ->activas()
                ->orderBy('nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $instituciones,
                'ciudad' => $ciudad->load(['estado', 'estado.pais']),
                'total' => $instituciones->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las instituciones de la ciudad',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener instituciones por estado
     */
    public function porEstado($estadoId): JsonResponse
    {
        try {
            $estado = Estado::find($estadoId);

            if (! $estado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estado no encontrado',
                ], 404);
            }

            $instituciones = Institucion::porEstado($estadoId)
                ->conUbicacionCompleta()
                ->activas()
                ->orderBy('nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $instituciones,
                'estado' => $estado->load(['pais', 'ciudades']),
                'total' => $instituciones->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las instituciones del estado',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener instituciones por país
     */
    public function porPais($paisId): JsonResponse
    {
        try {
            $pais = Pais::find($paisId);

            if (! $pais) {
                return response()->json([
                    'success' => false,
                    'message' => 'País no encontrado',
                ], 404);
            }

            $instituciones = Institucion::porPais($paisId)
                ->conUbicacionCompleta()
                ->activas()
                ->orderBy('nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $instituciones,
                'pais' => $pais->load(['estados', 'estados.ciudades']),
                'total' => $instituciones->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las instituciones del país',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener una institución específica
     */
    public function show($id): JsonResponse
    {
        try {
            $institucion = Institucion::conUbicacionCompleta()->find($id);

            if (! $institucion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institución no encontrada',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $institucion,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la institución',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar instituciones
     */
    public function buscar(Request $request): JsonResponse
    {
        try {
            $termino = $request->get('q', '');

            if (strlen($termino) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'El término de búsqueda debe tener al menos 2 caracteres',
                ], 400);
            }

            $instituciones = Institucion::busquedaJerarquica($termino)
                ->conUbicacionCompleta()
                ->activas()
                ->orderBy('nombre')
                ->limit(50)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $instituciones,
                'termino' => $termino,
                'total' => $instituciones->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en la búsqueda de instituciones',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener estructura jerárquica de instituciones por ubicación
     */
    public function estructuraJerarquica(): JsonResponse
    {
        try {
            $estructura = Pais::with([
                'estados' => function ($query) {
                    $query->whereHas('ciudades.instituciones', function ($q) {
                        $q->where('estado', 'activo');
                    })->with([
                        'ciudades' => function ($ciudadQuery) {
                            $ciudadQuery->whereHas('instituciones', function ($q) {
                                $q->where('estado', 'activo');
                            })->with([
                                'instituciones' => function ($institucionQuery) {
                                    $institucionQuery->where('estado', 'activo')
                                        ->orderBy('nombre');
                                },
                            ])->orderBy('nombre');
                        },
                    ])->orderBy('nombre');
                },
            ])->orderBy('nombre')->get();

            return response()->json([
                'success' => true,
                'data' => $estructura,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la estructura jerárquica',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de instituciones
     */
    public function estadisticas(): JsonResponse
    {
        try {
            $stats = [
                'total_instituciones' => Institucion::count(),
                'instituciones_activas' => Institucion::activas()->count(),
                'instituciones_inactivas' => Institucion::inactivas()->count(),
                'por_pais' => Pais::withCount([
                    'estados as total_instituciones' => function ($query) {
                        $query->join('ciudades', 'estados.id', '=', 'ciudades.estado_id')
                            ->join('instituciones', 'ciudades.id', '=', 'instituciones.ciudad_id');
                    },
                ])->get(),
                'por_estado' => Estado::withCount([
                    'ciudades as total_instituciones' => function ($query) {
                        $query->join('instituciones', 'ciudades.id', '=', 'instituciones.ciudad_id');
                    },
                ])->orderBy('total_instituciones', 'desc')->limit(10)->get(),
                'por_ciudad' => Ciudad::withCount('instituciones')
                    ->orderBy('instituciones_count', 'desc')
                    ->limit(10)
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las estadísticas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
