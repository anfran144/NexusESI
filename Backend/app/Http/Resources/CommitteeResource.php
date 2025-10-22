<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommitteeResource extends JsonResource
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
            'event' => $this->whenLoaded('event', function () {
                return [
                    'id' => $this->event->id,
                    'name' => $this->event->name,
                    'status' => $this->event->status,
                ];
            }),
            'members' => $this->whenLoaded('users', function () {
                return $this->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'assigned_at' => $user->pivot->assigned_at,
                    ];
                });
            }),
            'members_count' => $this->when(
                $this->relationLoaded('users'),
                fn () => $this->users->count()
            ),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
