<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'start_date' => $this->start_date->format('Y-m-d'),
            'end_date' => $this->end_date->format('Y-m-d'),
            'status' => $this->status,
            'coordinator' => $this->whenLoaded('coordinator', function () {
                return [
                    'id' => $this->coordinator->id,
                    'name' => $this->coordinator->name,
                    'email' => $this->coordinator->email,
                ];
            }),
            'institution' => $this->whenLoaded('institution', function () {
                return [
                    'id' => $this->institution->id,
                    'nombre' => $this->institution->nombre,
                    'identificador' => $this->institution->identificador,
                ];
            }),
            'committees' => CommitteeResource::collection($this->whenLoaded('committees')),
            'participants' => EventParticipantResource::collection($this->whenLoaded('participants')),
            'participants_count' => $this->when(
                $this->relationLoaded('participants'),
                fn () => $this->participants->where('is_active', true)->count()
            ),
            'total_participants_count' => $this->when(
                $this->relationLoaded('participants'),
                fn () => $this->participants->count()
            ),
            'committees_count' => $this->when(
                $this->relationLoaded('committees'),
                fn () => $this->committees->count()
            ),
            'progress' => $this->when(
                $this->relationLoaded('tasks'),
                function () {
                    // Calcular progreso basado en tareas completadas
                    $tasks = $this->tasks;
                    if ($tasks->isEmpty()) {
                        return 0;
                    }
                    $totalTasks = $tasks->count();
                    $completedTasks = $tasks->where('status', 'Completed')->count();
                    // Porcentaje sin decimales para consistencia en la UI
                    return $totalTasks > 0 ? (int) round(($completedTasks / $totalTasks) * 100) : 0;
                }
            ),
            'tasks_completed' => $this->when(
                $this->relationLoaded('tasks'),
                fn () => $this->tasks->where('status', 'Completed')->count()
            ),
            'time_info' => $this->getStatusBasedTimeInfo(),
            'can_perform_actions' => [
                'can_edit_structure' => $this->canPerformAction('edit_structure'),
                'can_delete' => $this->canPerformAction('delete'),
                'can_manage_committees' => $this->canPerformAction('manage_committees'),
                'can_manage_tasks' => $this->canPerformAction('manage_tasks'),
                'can_manage_participants' => $this->canPerformAction('manage_participants'),
                'can_execute_tasks' => $this->canPerformAction('execute_tasks'),
                'can_finalize' => $this->canPerformAction('finalize'),
                'can_reuse_data' => $this->canPerformAction('reuse_data'),
            ],
            'status_transition_suggested' => $this->shouldSuggestFinalization(),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
