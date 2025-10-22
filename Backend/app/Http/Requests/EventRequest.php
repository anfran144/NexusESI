<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EventRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // La autorización se maneja en las políticas
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $user = auth()->user();

        // Asignar automáticamente el coordinator_id y institution_id del usuario autenticado
        $this->merge([
            'coordinator_id' => $user->id,
            'institution_id' => $user->institution_id,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $eventId = $this->route('event')?->id;

        return [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'coordinator_id' => [
                'required',
                'exists:users,id',
            ],
            'institution_id' => [
                'required',
                'exists:instituciones,id',
            ],
            'status' => [
                'sometimes',
                Rule::in(['planificación', 'en_progreso', 'finalizado', 'cancelado']),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del evento es obligatorio.',
            'name.max' => 'El nombre del evento no puede exceder 255 caracteres.',
            'description.required' => 'La descripción del evento es obligatoria.',
            'start_date.required' => 'La fecha de inicio es obligatoria.',
            'start_date.date' => 'La fecha de inicio debe ser una fecha válida.',
            'start_date.after_or_equal' => 'La fecha de inicio debe ser hoy o posterior.',
            'end_date.required' => 'La fecha de fin es obligatoria.',
            'end_date.date' => 'La fecha de fin debe ser una fecha válida.',
            'end_date.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio.',
            'coordinator_id.required' => 'El coordinador es obligatorio.',
            'coordinator_id.exists' => 'El coordinador seleccionado no existe.',
            'institution_id.required' => 'La institución es obligatoria.',
            'institution_id.exists' => 'La institución seleccionada no existe.',
            'status.in' => 'El estado del evento no es válido.',
        ];
    }
}
