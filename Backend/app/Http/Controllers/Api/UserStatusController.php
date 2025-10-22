<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserStatusController extends Controller
{
    /**
     * Constructor - Aplicar middleware de autenticación
     */
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Cambiar el estado de un usuario
     */
    public function changeStatus(Request $request, int $userId): JsonResponse
    {
        try {
            $user = User::with(['roles', 'institution'])->findOrFail($userId);

            // Verificar permisos
            $this->authorize('update', $user);

            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:pending_approval,active,suspended',
                'reason' => 'sometimes|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $oldStatus = $user->status;
            $newStatus = $request->status;

            // Validar transiciones de estado
            if (! $this->isValidStatusTransition($oldStatus, $newStatus)) {
                return response()->json([
                    'success' => false,
                    'message' => "Transición de estado no válida: de '{$oldStatus}' a '{$newStatus}'",
                ], 400);
            }

            // Actualizar estado
            $user->update(['status' => $newStatus]);

            // Log del cambio (opcional - se puede implementar un sistema de auditoría)
            \Log::info('User status changed', [
                'user_id' => $userId,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => auth()->id(),
                'reason' => $request->reason,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Estado del usuario actualizado exitosamente',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'status' => $user->status,
                        'status_display' => $this->getStatusDisplay($user->status),
                        'institution' => $user->institution ? [
                            'id' => $user->institution->id,
                            'nombre' => $user->institution->nombre,
                        ] : null,
                        'roles' => $user->getRoleNames(),
                    ],
                    'change' => [
                        'from' => $oldStatus,
                        'to' => $newStatus,
                        'reason' => $request->reason,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar el estado del usuario',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener usuarios por estado
     */
    public function getUsersByStatus(Request $request, string $status): JsonResponse
    {
        try {
            // Validar estado
            if (! in_array($status, ['pending_approval', 'active', 'suspended'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estado no válido',
                ], 400);
            }

            $perPage = $request->get('per_page', 15);
            $users = User::with(['roles', 'institution'])
                ->byStatus($status)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $users,
                'status' => $status,
                'status_display' => $this->getStatusDisplay($status),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios por estado',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Aprobar múltiples usuarios pendientes
     */
    public function approveMultiple(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Datos de validación incorrectos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $users = User::whereIn('id', $request->user_ids)
                ->where('status', 'pending_approval')
                ->get();

            if ($users->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron usuarios pendientes de aprobación',
                ], 404);
            }

            // Verificar permisos para cada usuario
            foreach ($users as $user) {
                $this->authorize('update', $user);
            }

            // Aprobar usuarios
            $approvedCount = User::whereIn('id', $request->user_ids)
                ->where('status', 'pending_approval')
                ->update(['status' => 'active']);

            return response()->json([
                'success' => true,
                'message' => "Se aprobaron {$approvedCount} usuarios exitosamente",
                'data' => [
                    'approved_count' => $approvedCount,
                    'user_ids' => $request->user_ids,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al aprobar usuarios',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validar si una transición de estado es válida
     */
    private function isValidStatusTransition(string $from, string $to): bool
    {
        $validTransitions = [
            'pending_approval' => ['active', 'suspended'],
            'active' => ['suspended'],
            'suspended' => ['active'],
        ];

        return isset($validTransitions[$from]) && in_array($to, $validTransitions[$from]);
    }

    /**
     * Obtener el nombre de visualización del estado
     */
    private function getStatusDisplay(string $status): string
    {
        return match ($status) {
            'active' => 'Activo',
            'pending_approval' => 'Pendiente de Aprobación',
            'suspended' => 'Suspendido',
            default => 'Desconocido'
        };
    }
}
