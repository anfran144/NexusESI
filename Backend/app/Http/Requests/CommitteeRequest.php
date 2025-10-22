<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CommitteeRequest extends FormRequest
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
        $committeeId = $this->route('committee')?->id;
        $eventId = $this->input('event_id');

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('committees', 'name')
                    ->where('event_id', $eventId)
                    ->ignore($committeeId),
            ],
            'event_id' => 'required|exists:events,id',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del comité es obligatorio.',
            'name.max' => 'El nombre del comité no puede exceder 100 caracteres.',
            'name.unique' => 'Ya existe un comité con este nombre en el evento.',
            'event_id.required' => 'El evento es obligatorio.',
            'event_id.exists' => 'El evento seleccionado no existe.',
        ];
    }
}
