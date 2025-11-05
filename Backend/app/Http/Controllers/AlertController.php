<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AlertController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Alert::with(['task.event', 'task.committee.event', 'user'])
            ->where('user_id', $user->id);

        // Filtros opcionales
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('is_read')) {
            $query->where('is_read', $request->boolean('is_read'));
        }

        // Ordenar por fecha de creación (más recientes primero)
        $alerts = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $alerts,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:255',
            'type' => 'required|in:Preventive,Critical',
            'task_id' => 'nullable|exists:tasks,id',
        ]);

        $alert = Alert::create([
            'message' => $request->message,
            'type' => $request->type,
            'task_id' => $request->task_id,
            'user_id' => Auth::id(),
            'is_read' => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => $alert->load(['task.event', 'task.committee.event', 'user']),
            'message' => 'Alerta creada exitosamente',
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Alert $alert): JsonResponse
    {
        // Verificar que el usuario puede ver esta alerta
        if ($alert->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para ver esta alerta',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $alert->load(['task.event', 'task.committee.event', 'user']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Alert $alert): JsonResponse
    {
        // Verificar que el usuario puede modificar esta alerta
        if ($alert->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para modificar esta alerta',
            ], 403);
        }

        $request->validate([
            'is_read' => 'sometimes|boolean',
            'message' => 'sometimes|string|max:255',
        ]);

        $alert->update($request->only(['is_read', 'message']));

        return response()->json([
            'success' => true,
            'data' => $alert->load(['task.committee.event', 'user']),
            'message' => 'Alerta actualizada exitosamente',
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Alert $alert): JsonResponse
    {
        // Verificar que el usuario puede eliminar esta alerta
        if ($alert->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar esta alerta',
            ], 403);
        }

        $alert->delete();

        return response()->json([
            'success' => true,
            'message' => 'Alerta eliminada exitosamente',
        ]);
    }

    /**
     * Marcar alerta como leída
     */
    public function markAsRead(Alert $alert): JsonResponse
    {
        // Verificar que el usuario puede modificar esta alerta
        if ($alert->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para modificar esta alerta',
            ], 403);
        }

        $alert->markAsRead();

        return response()->json([
            'success' => true,
            'data' => $alert->load(['task.committee.event', 'user']),
            'message' => 'Alerta marcada como leída',
        ]);
    }

    /**
     * Marcar todas las alertas como leídas
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();
        
        Alert::where('user_id', $user->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Todas las alertas han sido marcadas como leídas',
        ]);
    }

    /**
     * Obtener estadísticas de alertas
     */
    public function statistics(): JsonResponse
    {
        $user = Auth::user();
        
        $stats = [
            'total' => Alert::where('user_id', $user->id)->count(),
            'unread' => Alert::where('user_id', $user->id)->where('is_read', false)->count(),
            'preventive' => Alert::where('user_id', $user->id)->where('type', 'Preventive')->count(),
            'critical' => Alert::where('user_id', $user->id)->where('type', 'Critical')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
