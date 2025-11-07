<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventParticipantResource extends JsonResource
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
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'institution' => $this->when(
                        $this->user->relationLoaded('institution'),
                        function () {
                            return [
                                'id' => $this->user->institution->id,
                                'nombre' => $this->user->institution->nombre,
                                'identificador' => $this->user->institution->identificador,
                            ];
                        }
                    ),
                ];
            }),
            'participation_role' => $this->participation_role,
            'participation_role_display' => $this->getParticipationRoleDisplay(),
            'is_active' => $this->is_active ?? true,
            'ended_at' => $this->ended_at?->format('Y-m-d H:i:s'),
            'event' => $this->whenLoaded('event', function () {
                return [
                    'id' => $this->event->id,
                    'name' => $this->event->name,
                    'status' => $this->event->status,
                ];
            }),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Obtener nombre legible del rol de participación
     */
    private function getParticipationRoleDisplay(): string
    {
        if (!$this->participation_role) {
            return 'Participante';
        }

        return match($this->participation_role) {
            'seedbed_leader' => 'Líder de Semillero',
            'coordinator' => 'Coordinador',
            default => 'Participante',
        };
    }
}
