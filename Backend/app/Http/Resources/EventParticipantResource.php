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
}
