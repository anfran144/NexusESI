<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MeetingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // La autorización se maneja en las políticas
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $meetingType = $this->input('meeting_type');
        $event = $this->route('event');

        $rules = [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'scheduled_at' => 'required|date|after:now',
            'location' => 'nullable|string|max:255',
            'meeting_type' => [
                'required',
                Rule::in(['planning', 'coordination', 'committee', 'general']),
            ],
        ];

        // Si el tipo requiere comités, validar committee_ids
        if (in_array($meetingType, ['coordination', 'committee'])) {
            $rules['committee_ids'] = 'required|array|min:1';
            $rules['committee_ids.*'] = [
                'required',
                'integer',
                'exists:committees,id',
                function ($attribute, $value, $fail) use ($event) {
                    // Verificar que el comité pertenezca al evento
                    if ($event) {
                        $committee = \App\Models\Committee::find($value);
                        if (!$committee || $committee->event_id !== $event->id) {
                            $fail('El comité seleccionado no pertenece a este evento.');
                        }
                    }
                },
            ];
        }

        // Validar que scheduled_at esté dentro del rango del evento
        if ($event) {
            $rules['scheduled_at'] = [
                'required',
                'date',
                'after:now',
                function ($attribute, $value, $fail) use ($event) {
                    $scheduledDate = \Carbon\Carbon::parse($value);
                    $eventStart = \Carbon\Carbon::parse($event->start_date);
                    $eventEnd = \Carbon\Carbon::parse($event->end_date)->endOfDay();

                    if ($scheduledDate->lt($eventStart) || $scheduledDate->gt($eventEnd)) {
                        $fail('La fecha de la reunión debe estar dentro del rango del evento.');
                    }
                },
            ];
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'El título de la reunión es obligatorio.',
            'title.max' => 'El título no puede exceder 255 caracteres.',
            'scheduled_at.required' => 'La fecha y hora de la reunión es obligatoria.',
            'scheduled_at.date' => 'La fecha y hora debe ser una fecha válida.',
            'scheduled_at.after' => 'La fecha y hora debe ser posterior a la fecha actual.',
            'meeting_type.required' => 'El tipo de reunión es obligatorio.',
            'meeting_type.in' => 'El tipo de reunión no es válido.',
            'committee_ids.required' => 'Debe seleccionar al menos un comité para este tipo de reunión.',
            'committee_ids.array' => 'Los comités deben ser un array.',
            'committee_ids.min' => 'Debe seleccionar al menos un comité.',
            'committee_ids.*.exists' => 'Uno o más comités seleccionados no existen.',
        ];
    }
}
