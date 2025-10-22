<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ciudad;
use App\Models\Estado;
use App\Models\Pais;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Obtener todos los países
     */
    public function getPaises(): JsonResponse
    {
        try {
            $paises = Pais::orderBy('nombre')->get();

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
     * Obtener estados por país
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

            $estados = Estado::porPais($paisId)
                ->orderBy('nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $estados,
                'pais' => $pais,
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
     * Obtener ciudades por estado
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

            $ciudades = Ciudad::porEstado($estadoId)
                ->orderBy('nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $ciudades,
                'estado' => $estado,
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
     * Obtener ciudades por país
     */
    public function getCiudadesByPais($paisId): JsonResponse
    {
        try {
            $pais = Pais::find($paisId);

            if (! $pais) {
                return response()->json([
                    'success' => false,
                    'message' => 'País no encontrado',
                ], 404);
            }

            $ciudades = Ciudad::porPais($paisId)
                ->conEstadoYPais()
                ->orderBy('nombre')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $ciudades,
                'pais' => $pais,
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
     * Búsqueda jerárquica completa
     */
    public function getHierarchicalStructure($paisId = null): JsonResponse
    {
        try {
            if ($paisId) {
                $pais = Pais::with(['estados.ciudades'])
                    ->find($paisId);

                if (! $pais) {
                    return response()->json([
                        'success' => false,
                        'message' => 'País no encontrado',
                    ], 404);
                }

                return response()->json([
                    'success' => true,
                    'data' => $pais,
                    'message' => 'Estructura jerárquica obtenida exitosamente',
                ]);
            } else {
                $paises = Pais::with(['estados.ciudades'])
                    ->orderBy('nombre')
                    ->get();

                return response()->json([
                    'success' => true,
                    'data' => $paises,
                    'message' => 'Estructura jerárquica completa obtenida exitosamente',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la estructura jerárquica',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Búsqueda de ubicaciones por término
     */
    public function searchLocations(Request $request): JsonResponse
    {
        try {
            $term = $request->get('q', '');

            if (strlen($term) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'El término de búsqueda debe tener al menos 2 caracteres',
                ], 400);
            }

            $paises = Pais::porNombre($term)->get();
            $estados = Estado::porNombre($term)->conPais()->get();
            $ciudades = Ciudad::busquedaJerarquica($term)->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'paises' => $paises,
                    'estados' => $estados,
                    'ciudades' => $ciudades,
                ],
                'message' => 'Búsqueda completada exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en la búsqueda',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
