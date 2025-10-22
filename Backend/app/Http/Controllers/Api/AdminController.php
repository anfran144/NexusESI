<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Institucion;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

final class AdminController extends Controller
{
    /**
     * Constructor - Aplicar middleware de autenticación y rol admin
     */
    public function __construct()
    {
        $this->middleware(['auth:api', 'role:admin']);
    }

    /**
     * Obtener datos del panel de control del administrador
     */
    public function dashboard(): JsonResponse
    {
        try {
            // Estadísticas generales
            $totalInstituciones = Institucion::count();
            $institucionesActivas = Institucion::where('estado', 'activo')->count();

            // Contar coordinadores y líderes
            $coordinadores = User::role('coordinator', 'api')->count();
            $lideres = User::role('seedbed_leader', 'api')->count();

            // Usuarios totales por rol
            $usuariosPorRol = User::join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_type', User::class)
                ->groupBy('roles.name')
                ->selectRaw('roles.name as rol, COUNT(*) as total')
                ->pluck('total', 'rol')
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'instituciones' => [
                        'total' => $totalInstituciones,
                        'activas' => $institucionesActivas,
                        'inactivas' => $totalInstituciones - $institucionesActivas,
                    ],
                    'usuarios' => [
                        'coordinadores' => $coordinadores,
                        'lideres' => $lideres,
                        'total' => User::count(),
                        'por_rol' => $usuariosPorRol,
                    ],
                    'estadisticas_recientes' => [
                        'instituciones_mes' => Institucion::whereMonth('created_at', now()->month)->count(),
                        'usuarios_mes' => User::whereMonth('created_at', now()->month)->count(),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener datos del dashboard',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar todas las instituciones con filtros
     */
    public function instituciones(Request $request): JsonResponse
    {
        try {
            $query = Institucion::with(['ciudad', 'ciudad.estado', 'ciudad.estado.pais']);

            // Filtros
            if ($request->filled('nombre')) {
                $query->where('nombre', 'like', '%'.$request->nombre.'%');
            }

            if ($request->filled('identificador')) {
                $query->where('identificador', 'like', '%'.$request->identificador.'%');
            }

            if ($request->filled('estado')) {
                $query->where('estado', $request->estado);
            }

            if ($request->filled('ciudad_id')) {
                $query->where('ciudad_id', $request->ciudad_id);
            }

            // Paginación
            $perPage = $request->get('per_page', 15);
            $instituciones = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $instituciones,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener instituciones',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Crear nueva institución
     */
    public function crearInstitucion(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:255',
                'identificador' => 'required|string|max:100|unique:instituciones,identificador',
                'ciudad_id' => 'required|exists:ciudades,id',
                'estado' => 'in:activo,inactivo,pendiente',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $institucion = Institucion::create([
                'nombre' => $request->nombre,
                'identificador' => $request->identificador,
                'ciudad_id' => $request->ciudad_id,
                'estado' => $request->estado ?? 'pendiente',
            ]);

            $institucion->load(['ciudad', 'ciudad.estado', 'ciudad.estado.pais']);

            return response()->json([
                'success' => true,
                'message' => 'Institución creada exitosamente',
                'data' => $institucion,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear institución',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar institución
     */
    public function actualizarInstitucion(Request $request, int $id): JsonResponse
    {
        try {
            $institucion = Institucion::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nombre' => 'sometimes|required|string|max:255',
                'identificador' => 'sometimes|required|string|max:100|unique:instituciones,identificador,'.$id,
                'ciudad_id' => 'sometimes|required|exists:ciudades,id',
                'estado' => 'sometimes|in:activo,inactivo,pendiente',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $institucion->update($request->only(['nombre', 'identificador', 'ciudad_id', 'estado']));
            $institucion->load(['ciudad', 'ciudad.estado', 'ciudad.estado.pais']);

            return response()->json([
                'success' => true,
                'message' => 'Institución actualizada exitosamente',
                'data' => $institucion,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar institución',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Listar todos los usuarios con filtros
     */
    public function usuarios(Request $request): JsonResponse
    {
        try {
            $query = User::with(['roles', 'institution']);

            // Filtros
            if ($request->filled('rol')) {
                $query->role($request->rol);
            }

            if ($request->filled('status')) {
                $query->byStatus($request->status);
            }

            if ($request->filled('institution_id')) {
                $query->byInstitution($request->institution_id);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%');
                });
            }

            // Paginación
            $perPage = $request->get('per_page', 15);
            $usuarios = $query->paginate($perPage);

            // Formatear datos
            $usuarios->getCollection()->transform(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'status' => $user->status,
                    'status_display' => match ($user->status) {
                        'active' => 'Activo',
                        'pending_approval' => 'Pendiente de Aprobación',
                        'suspended' => 'Suspendido',
                        default => 'Desconocido'
                    },
                    'institution_id' => $user->institution_id,
                    'institution' => $user->institution ? [
                        'id' => $user->institution->id,
                        'nombre' => $user->institution->nombre,
                        'identificador' => $user->institution->identificador,
                    ] : null,
                    'rol' => $user->getRoleNames()->first() ?? 'Sin rol',
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $usuarios,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cambiar rol de usuario
     */
    public function cambiarRolUsuario(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'rol' => 'required|string|in:admin,coordinator,seedbed_leader',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rol inválido',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Remover roles anteriores y asignar el nuevo
            $user->syncRoles([$request->rol]);

            return response()->json([
                'success' => true,
                'message' => 'Rol actualizado exitosamente',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'nuevo_rol' => $request->rol,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar rol del usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Activar/Desactivar usuario
     */
    public function toggleUsuario(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'activo' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estado inválido',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Activar/desactivar basado en email_verified_at
            if ($request->activo) {
                $user->email_verified_at = $user->email_verified_at ?? now();
            } else {
                $user->email_verified_at = null;
            }

            $user->save();

            return response()->json([
                'success' => true,
                'message' => $request->activo ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'estado' => $request->activo ? 'Activo' : 'Inactivo',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar estado del usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
