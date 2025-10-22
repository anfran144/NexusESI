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
                fn () => $this->participants->count()
            ),
            'approved_participants_count' => $this->when(
                $this->relationLoaded('participants'),
                fn () => $this->participants->where('status', 'aprobado')->count()
            ),
            'pending_participants_count' => $this->when(
                $this->relationLoaded('participants'),
                fn () => $this->participants->where('status', 'pendiente')->count()
            ),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
