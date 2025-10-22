<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ciudad;
use App\Models\Estado;
use App\Models\Institucion;
use App\Models\Pais;
use Illuminate\Http\JsonResponse;

class RegistrationController extends Controller
{
    /**
     * Obtener todos los países para el formulario de registro
     */
    public function getPaises(): JsonResponse
    {
        try {
            $paises = Pais::orderBy('nombre')->get(['id', 'nombre', 'codigo_iso']);

            return response()->json([
                'success' => true,
                'data' => $paises,
                'message' => 'Países obtenidos exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los países',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener estados/departamentos por país para el formulario de registro
     */
    public function getEstadosByPais($paisId): JsonResponse
    {
        try {
            $pais = Pais::find($paisId);

            if (! $pais) {
                return response()->json([
                    'success' => false,
                    'message' => 'País no encontrado',
                ], 404);
            }

            $estados = Estado::where('pais_id', $paisId)
                ->orderBy('nombre')
                ->get(['id', 'nombre']);

            return response()->json([
                'success' => true,
                'data' => $estados,
                'pais' => [
                    'id' => $pais->id,
                    'nombre' => $pais->nombre,
                ],
                'message' => 'Estados obtenidos exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los estados',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener ciudades por estado para el formulario de registro
     */
    public function getCiudadesByEstado($estadoId): JsonResponse
    {
        try {
            $estado = Estado::with('pais')->find($estadoId);

            if (! $estado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estado no encontrado',
                ], 404);
            }

            $ciudades = Ciudad::where('estado_id', $estadoId)
                ->orderBy('nombre')
                ->get(['id', 'nombre']);

            return response()->json([
                'success' => true,
                'data' => $ciudades,
                'estado' => [
                    'id' => $estado->id,
                    'nombre' => $estado->nombre,
                    'pais' => [
                        'id' => $estado->pais->id,
                        'nombre' => $estado->pais->nombre,
                    ],
                ],
                'message' => 'Ciudades obtenidas exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las ciudades',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener instituciones activas por ciudad para el formulario de registro
     */
    public function getInstitucionesByCiudad($ciudadId): JsonResponse
    {
        try {
            $ciudad = Ciudad::with(['estado', 'estado.pais'])->find($ciudadId);

            if (! $ciudad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ciudad no encontrada',
                ], 404);
            }

            // Solo instituciones activas para el registro
            $instituciones = Institucion::where('ciudad_id', $ciudadId)
                ->where('estado', 'activo')
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'identificador']);

            if ($instituciones->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay instituciones disponibles en esta ciudad',
                    'data' => [],
                    'ciudad' => [
                        'id' => $ciudad->id,
                        'nombre' => $ciudad->nombre,
                        'estado' => [
                            'id' => $ciudad->estado->id,
                            'nombre' => $ciudad->estado->nombre,
                            'pais' => [
                                'id' => $ciudad->estado->pais->id,
                                'nombre' => $ciudad->estado->pais->nombre,
                            ],
                        ],
                    ],
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $instituciones,
                'ciudad' => [
                    'id' => $ciudad->id,
                    'nombre' => $ciudad->nombre,
                    'estado' => [
                        'id' => $ciudad->estado->id,
                        'nombre' => $ciudad->estado->nombre,
                        'pais' => [
                            'id' => $ciudad->estado->pais->id,
                            'nombre' => $ciudad->estado->pais->nombre,
                        ],
                    ],
                ],
                'total' => $instituciones->count(),
                'message' => 'Instituciones obtenidas exitosamente',
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
     * Obtener la estructura jerárquica completa para el formulario de registro
     * Útil para cargar datos iniciales o para debugging
     */
    public function getHierarchicalStructure($paisId = null): JsonResponse
    {
        try {
            $query = Pais::with([
                'estados' => function ($query) {
                    $query->orderBy('nombre');
                },
                'estados.ciudades' => function ($query) {
                    $query->orderBy('nombre');
                },
                'estados.ciudades.instituciones' => function ($query) {
                    $query->where('estado', 'activo')->orderBy('nombre');
                },
            ]);

            if ($paisId) {
                $paises = $query->where('id', $paisId)->get();
                if ($paises->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'País no encontrado',
                    ], 404);
                }
            } else {
                $paises = $query->orderBy('nombre')->get();
            }

            // Formatear la respuesta para el frontend
            $structure = $paises->map(function ($pais) {
                return [
                    'id' => $pais->id,
                    'nombre' => $pais->nombre,
                    'codigo_iso' => $pais->codigo_iso,
                    'estados' => $pais->estados->map(function ($estado) {
                        return [
                            'id' => $estado->id,
                            'nombre' => $estado->nombre,
                            'ciudades' => $estado->ciudades->map(function ($ciudad) {
                                return [
                                    'id' => $ciudad->id,
                                    'nombre' => $ciudad->nombre,
                                    'instituciones' => $ciudad->instituciones->map(function ($institucion) {
                                        return [
                                            'id' => $institucion->id,
                                            'nombre' => $institucion->nombre,
                                            'identificador' => $institucion->identificador,
                                        ];
                                    }),
                                ];
                            }),
                        ];
                    }),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $structure,
                'message' => 'Estructura jerárquica obtenida exitosamente',
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
     * Validar disponibilidad de institución para registro
     */
    public function validateInstitution($institutionId): JsonResponse
    {
        try {
            $institution = Institucion::with(['ciudad', 'ciudad.estado', 'ciudad.estado.pais'])
                ->find($institutionId);

            if (! $institution) {
                return response()->json([
                    'success' => false,
                    'message' => 'Institución no encontrada',
                    'available' => false,
                ], 404);
            }

            $isAvailable = $institution->estado === 'activo';

            return response()->json([
                'success' => true,
                'available' => $isAvailable,
                'institution' => [
                    'id' => $institution->id,
                    'nombre' => $institution->nombre,
                    'identificador' => $institution->identificador,
                    'estado' => $institution->estado,
                    'ubicacion' => [
                        'ciudad' => $institution->ciudad->nombre,
                        'estado' => $institution->ciudad->estado->nombre,
                        'pais' => $institution->ciudad->estado->pais->nombre,
                    ],
                ],
                'message' => $isAvailable
                    ? 'Institución disponible para registro'
                    : 'Institución no disponible para registro',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al validar la institución',
                'available' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
