<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Institucion;
use App\Models\User;
use App\Models\Committee;
use App\Models\EventParticipant;
use App\Models\Task;
use App\Models\TaskProgress;
use App\Models\Incident;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class TestEventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener Universidad Mariana
        $universidadMariana = Institucion::where('nombre', 'Universidad Mariana')->first();

        if (!$universidadMariana) {
            $this->command->warn('Universidad Mariana no encontrada. Ejecuta primero InstitucionSeeder.');
            return;
        }

        // Crear o buscar el coordinador
        $coordinator = User::firstOrCreate(
            ['email' => 'adiazciro@gmail.com'],
            [
                'name' => 'Coordinador de Prueba',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
                'status' => 'active',
                'institution_id' => $universidadMariana->id,
            ]
        );

        // Asignar rol de coordinador si no lo tiene
        $coordinatorRole = Role::where('name', 'coordinator')->first();
        if ($coordinatorRole && !$coordinator->hasRole('coordinator')) {
            $coordinator->assignRole($coordinatorRole);
        }

        // Crear 9 líderes de semillero
        $seedbedLeaderRole = Role::where('name', 'seedbed_leader')->first();
        $leaders = [];
        
        for ($i = 1; $i <= 9; $i++) {
            $leader = User::firstOrCreate(
                ['email' => "usuario{$i}@nexusesi.com"],
                [
                    'name' => "Usuario {$i}",
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                    'status' => 'active',
                    'institution_id' => $universidadMariana->id,
                ]
            );

            // Asignar rol de líder de semillero si no lo tiene
            if ($seedbedLeaderRole && !$leader->hasRole('seedbed_leader')) {
                $leader->assignRole($seedbedLeaderRole);
            }

            $leaders[] = $leader;
        }

        // Crear evento activo con fecha futura (para que esté en fase de planificación)
        $startDate = Carbon::now()->addMonths(2); // 2 meses en el futuro
        $endDate = $startDate->copy()->addDays(2); // 2 días de duración

        $event = Event::firstOrCreate(
            ['name' => 'Evento de Prueba para Planificación'],
            [
                'description' => 'Este es un evento de prueba creado para visualizar cómo se ve un evento activo en fase de planificación. Incluye comités, participantes y tareas de ejemplo.',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'coordinator_id' => $coordinator->id,
                'institution_id' => $universidadMariana->id,
                'status' => 'active',
            ]
        );

        $this->command->info("Evento '{$event->name}' creado/actualizado exitosamente.");

        // Crear comités y asignar miembros (y obtener distribución de líderes por comité)
        $leadersByCommittee = $this->createCommittees($event, $coordinator, $leaders);

        // Crear participantes del evento (solo los líderes, no el coordinador)
        $this->createParticipants($event, $leaders);

        // Crear tareas para el evento con asignación de líderes
        $tasks = $this->createTasks($event, $leadersByCommittee, $leaders);

        // Crear avances de tareas
        $this->createTaskProgress($tasks, $coordinator, $leaders);

        // Crear incidencias
        $this->createIncidents($tasks, $leaders);

        $this->command->info('Evento de prueba creado con todas sus relaciones.');
    }

    /**
     * Crear comités y asignar miembros
     */
    private function createCommittees(Event $event, User $coordinator, array $leaders): array
    {
        // Comité de Logística - asignar coordinador y primeros 3 líderes
        $comiteLogistica = Committee::firstOrCreate(
            ['name' => 'Comité de Logística', 'event_id' => $event->id]
        );

        $logisticaUserIds = [$coordinator->id];
        foreach (array_slice($leaders, 0, 3) as $leader) {
            $logisticaUserIds[] = $leader->id;
        }
        $comiteLogistica->users()->syncWithoutDetaching($logisticaUserIds);

        // Comité de Comunicaciones - asignar coordinador y siguientes 3 líderes
        $comiteComunicaciones = Committee::firstOrCreate(
            ['name' => 'Comité de Comunicaciones', 'event_id' => $event->id]
        );

        $comunicacionesUserIds = [$coordinator->id];
        foreach (array_slice($leaders, 3, 3) as $leader) {
            $comunicacionesUserIds[] = $leader->id;
        }
        $comiteComunicaciones->users()->syncWithoutDetaching($comunicacionesUserIds);

        // Comité de Evaluación - asignar coordinador y últimos 3 líderes
        $comiteEvaluacion = Committee::firstOrCreate(
            ['name' => 'Comité de Evaluación', 'event_id' => $event->id]
        );

        $evaluacionUserIds = [$coordinator->id];
        foreach (array_slice($leaders, 6, 3) as $leader) {
            $evaluacionUserIds[] = $leader->id;
        }
        $comiteEvaluacion->users()->syncWithoutDetaching($evaluacionUserIds);

        $this->command->info('Comités creados y miembros asignados.');

        // Retornar la distribución de líderes por comité
        return [
            'logistica' => array_slice($leaders, 0, 3),
            'comunicaciones' => array_slice($leaders, 3, 3),
            'evaluacion' => array_slice($leaders, 6, 3),
        ];
    }

    /**
     * Crear participantes del evento
     * El coordinador NO es participante, solo los líderes
     */
    private function createParticipants(Event $event, array $leaders): void
    {
        // Agregar todos los líderes como participantes del evento
        foreach ($leaders as $leader) {
            EventParticipant::firstOrCreate(
                [
                    'user_id' => $leader->id,
                    'event_id' => $event->id,
                ]
            );
        }

        $this->command->info('Participantes del evento creados (9 líderes).');
    }

    /**
     * Crear tareas para el evento
     */
    private function createTasks(Event $event, array $leadersByCommittee, array $leaders): array
    {
        $committees = $event->committees;
        $comiteLogistica = $committees->where('name', 'Comité de Logística')->first();
        $comiteComunicaciones = $committees->where('name', 'Comité de Comunicaciones')->first();
        $comiteEvaluacion = $committees->where('name', 'Comité de Evaluación')->first();

        // Fechas para las tareas (distribuidas antes del evento)
        $baseDate = $event->start_date->copy()->subMonths(1);
        
        $createdTasks = [];
        
        // Tareas del Comité de Logística
        if ($comiteLogistica) {
            $tareasLogistica = [
                [
                    'title' => 'Reservar espacios y auditorios',
                    'description' => 'Gestionar la reserva de todos los espacios necesarios para el evento',
                    'due_date' => $baseDate->copy()->addDays(10),
                    'status' => 'Pending',
                    'risk_level' => 'Low',
                ],
                [
                    'title' => 'Elaborar programación detallada',
                    'description' => 'Crear la programación hora a hora del evento',
                    'due_date' => $baseDate->copy()->addDays(20),
                    'status' => 'InProgress',
                    'risk_level' => 'Medium',
                ],
                [
                    'title' => 'Coordinar conferencia inaugural',
                    'description' => 'Contactar y coordinar con el conferencista principal',
                    'due_date' => $baseDate->copy()->addDays(25),
                    'status' => 'Pending',
                    'risk_level' => 'Medium',
                ],
            ];

            $idx = 0;
            foreach ($tareasLogistica as $tareaData) {
                // Asignar líder del comité en round-robin
                $assignee = $leadersByCommittee['logistica'][$idx % max(1, count($leadersByCommittee['logistica']))] ?? null;
                $idx++;

                // Si hay asignado y no está Completed, poner estado InProgress
                if ($assignee && $tareaData['status'] !== 'Completed') {
                    $tareaData['status'] = 'InProgress';
                }

                $task = Task::firstOrCreate(
                    [
                        'title' => $tareaData['title'],
                        'event_id' => $event->id,
                        'committee_id' => $comiteLogistica->id,
                    ],
                    [
                        'description' => $tareaData['description'],
                        'due_date' => $tareaData['due_date'],
                        'status' => $tareaData['status'],
                        'risk_level' => $tareaData['risk_level'],
                        'assigned_to_id' => $assignee?->id,
                    ]
                );
                // Si ya existía, asegurar asignación
                if ($assignee && $task->assigned_to_id !== $assignee->id) {
                    $task->assigned_to_id = $assignee->id;
                    if ($task->status !== 'Completed') {
                        $task->status = 'InProgress';
                    }
                    $task->save();
                }
                $createdTasks[] = $task;
            }
        }

        // Tareas del Comité de Comunicaciones
        if ($comiteComunicaciones) {
            $tareasComunicaciones = [
                [
                    'title' => 'Actualizar Términos de Referencia (TDRs)',
                    'description' => 'Revisar y actualizar los términos de referencia del evento',
                    'due_date' => $baseDate->copy()->addDays(5),
                    'status' => 'Completed',
                    'risk_level' => 'Low',
                ],
                [
                    'title' => 'Gestionar publicidad en redes sociales',
                    'description' => 'Crear contenido y publicar en Facebook, Instagram y otras plataformas',
                    'due_date' => $baseDate->copy()->addDays(15),
                    'status' => 'InProgress',
                    'risk_level' => 'Low',
                ],
                [
                    'title' => 'Coordinar con oficina de mercadeo',
                    'description' => 'Establecer comunicación y coordinar acciones con la oficina de mercadeo',
                    'due_date' => $baseDate->copy()->addDays(12),
                    'status' => 'Pending',
                    'risk_level' => 'Medium',
                ],
            ];

            $idx = 0;
            foreach ($tareasComunicaciones as $tareaData) {
                $assignee = $leadersByCommittee['comunicaciones'][$idx % max(1, count($leadersByCommittee['comunicaciones']))] ?? null;
                $idx++;
                if ($assignee && $tareaData['status'] !== 'Completed') {
                    $tareaData['status'] = 'InProgress';
                }
                $task = Task::firstOrCreate(
                    [
                        'title' => $tareaData['title'],
                        'event_id' => $event->id,
                        'committee_id' => $comiteComunicaciones->id,
                    ],
                    [
                        'description' => $tareaData['description'],
                        'due_date' => $tareaData['due_date'],
                        'status' => $tareaData['status'],
                        'risk_level' => $tareaData['risk_level'],
                        'assigned_to_id' => $assignee?->id,
                    ]
                );
                if ($assignee && $task->assigned_to_id !== $assignee->id) {
                    $task->assigned_to_id = $assignee->id;
                    if ($task->status !== 'Completed') {
                        $task->status = 'InProgress';
                    }
                    $task->save();
                }
                $createdTasks[] = $task;
            }
        }

        // Tareas del Comité de Evaluación
        if ($comiteEvaluacion) {
            $tareasEvaluacion = [
                [
                    'title' => 'Diseñar proceso de evaluación',
                    'description' => 'Crear el proceso completo de evaluación de proyectos',
                    'due_date' => $baseDate->copy()->addDays(8),
                    'status' => 'Completed',
                    'risk_level' => 'Low',
                ],
                [
                    'title' => 'Definir formatos de evaluación',
                    'description' => 'Diseñar los formatos que utilizarán los evaluadores',
                    'due_date' => $baseDate->copy()->addDays(18),
                    'status' => 'InProgress',
                    'risk_level' => 'Medium',
                ],
                [
                    'title' => 'Realizar capacitación para evaluadores',
                    'description' => 'Organizar y realizar sesión de capacitación para los evaluadores',
                    'due_date' => $baseDate->copy()->addDays(22),
                    'status' => 'Pending',
                    'risk_level' => 'Medium',
                ],
            ];

            $idx = 0;
            foreach ($tareasEvaluacion as $tareaData) {
                $assignee = $leadersByCommittee['evaluacion'][$idx % max(1, count($leadersByCommittee['evaluacion']))] ?? null;
                $idx++;
                if ($assignee && $tareaData['status'] !== 'Completed') {
                    $tareaData['status'] = 'InProgress';
                }
                $task = Task::firstOrCreate(
                    [
                        'title' => $tareaData['title'],
                        'event_id' => $event->id,
                        'committee_id' => $comiteEvaluacion->id,
                    ],
                    [
                        'description' => $tareaData['description'],
                        'due_date' => $tareaData['due_date'],
                        'status' => $tareaData['status'],
                        'risk_level' => $tareaData['risk_level'],
                        'assigned_to_id' => $assignee?->id,
                    ]
                );
                if ($assignee && $task->assigned_to_id !== $assignee->id) {
                    $task->assigned_to_id = $assignee->id;
                    if ($task->status !== 'Completed') {
                        $task->status = 'InProgress';
                    }
                    $task->save();
                }
                $createdTasks[] = $task;
            }
        }

        // Tareas generales (sin comité específico)
        $tareasGenerales = [
            [
                'title' => 'Definir proceso de inscripción',
                'description' => 'Establecer el proceso completo de inscripción de participantes',
                'due_date' => $baseDate->copy()->addDays(7),
                'status' => 'InProgress',
                'risk_level' => 'Low',
            ],
            [
                'title' => 'Preparar material promocional',
                'description' => 'Diseñar y preparar todo el material promocional del evento',
                'due_date' => $baseDate->copy()->addDays(14),
                'status' => 'Pending',
                'risk_level' => 'Low',
            ],
        ];

        $idx = 0;
        foreach ($tareasGenerales as $tareaData) {
            // Asignar líder cualquiera del evento (round-robin con todos los líderes)
            $assignee = $leaders[$idx % max(1, count($leaders))] ?? null;
            $idx++;
            if ($assignee && $tareaData['status'] !== 'Completed') {
                $tareaData['status'] = 'InProgress';
            }
            $task = Task::firstOrCreate(
                [
                    'title' => $tareaData['title'],
                    'event_id' => $event->id,
                    'committee_id' => null,
                ],
                [
                    'description' => $tareaData['description'],
                    'due_date' => $tareaData['due_date'],
                    'status' => $tareaData['status'],
                    'risk_level' => $tareaData['risk_level'],
                    'assigned_to_id' => $assignee?->id,
                ]
            );
            if ($assignee && $task->assigned_to_id !== $assignee->id) {
                $task->assigned_to_id = $assignee->id;
                if ($task->status !== 'Completed') {
                    $task->status = 'InProgress';
                }
                $task->save();
            }
            $createdTasks[] = $task;
        }

        $this->command->info('Tareas creadas para el evento.');
        
        return $createdTasks;
    }

    /**
     * Crear avances de tareas
     */
    private function createTaskProgress(array $tasks, User $coordinator, array $leaders): void
    {
        // Filtrar tareas que están en progreso o completadas
        $tasksInProgress = array_filter($tasks, function($task) {
            return in_array($task->status, ['InProgress', 'Completed']);
        });

        if (empty($tasksInProgress)) {
            return;
        }

        // Tomar algunas tareas para agregar avances
        $tasksForProgress = array_slice($tasksInProgress, 0, min(4, count($tasksInProgress)));

        // Seleccionar algunos líderes aleatorios para los avances
        $selectedLeaders = array_slice($leaders, 0, min(4, count($leaders)));
        
        $progressEntries = [
            [
                'description' => 'He iniciado el proceso de reserva. Ya contacté con el departamento de espacios y están revisando la disponibilidad.',
                'user' => $selectedLeaders[0] ?? $leaders[0],
            ],
            [
                'description' => 'He completado la primera versión del documento. Necesito revisión antes de finalizar.',
                'user' => $selectedLeaders[1] ?? $leaders[1],
            ],
            [
                'description' => 'Reunión programada con el conferencista para el próximo lunes. Esperando confirmación de horarios.',
                'user' => $coordinator,
            ],
            [
                'description' => 'Primeros avances en la programación. Tengo la estructura base lista, ahora necesito completar los detalles de cada actividad.',
                'user' => $selectedLeaders[2] ?? $leaders[2],
            ],
            [
                'description' => 'TDRs actualizados y revisados. Listos para publicación.',
                'user' => $coordinator,
            ],
            [
                'description' => 'Contenido para redes sociales en desarrollo. Primera publicación programada para la próxima semana.',
                'user' => $selectedLeaders[3] ?? $leaders[3],
            ],
        ];

        $progressIndex = 0;
        foreach ($tasksForProgress as $task) {
            // Agregar 1-2 avances por tarea
            $numProgress = rand(1, 2);
            for ($i = 0; $i < $numProgress && $progressIndex < count($progressEntries); $i++) {
                $progressData = $progressEntries[$progressIndex];
                TaskProgress::create([
                    'description' => $progressData['description'],
                    'task_id' => $task->id,
                    'user_id' => $progressData['user']->id,
                    'file_name' => null,
                    'file_path' => null,
                    'created_at' => Carbon::now()->subDays(rand(1, 7)),
                    'updated_at' => Carbon::now()->subDays(rand(1, 7)),
                ]);
                $progressIndex++;
            }
        }

        $this->command->info('Avances de tareas creados.');
    }

    /**
     * Crear incidencias
     */
    private function createIncidents(array $tasks, array $leaders): void
    {
        // Seleccionar algunas tareas para agregar incidencias
        $tasksForIncidents = array_filter($tasks, function($task) {
            return $task->status !== 'Completed';
        });

        if (empty($tasksForIncidents)) {
            return;
        }

        // Tomar algunas tareas aleatorias
        $selectedTasks = array_slice($tasksForIncidents, 0, min(3, count($tasksForIncidents)));

        $incidentDescriptions = [
            'Se requiere cambio en la fecha límite debido a retrasos en la disponibilidad de recursos.',
            'Falta información adicional del proveedor para completar la tarea. Esperando respuesta.',
            'Problema técnico detectado que requiere atención del coordinador antes de continuar.',
            'Se necesita aprobación adicional para proceder con esta actividad.',
            'Conflicto de horarios detectado que necesita resolución.',
        ];

        foreach ($selectedTasks as $index => $task) {
            $description = $incidentDescriptions[$index % count($incidentDescriptions)];
            
            // Crear incidencia reportada (algunas resueltas, otras no)
            $status = $index % 2 === 0 ? 'Reported' : 'Resolved';
            
            // Seleccionar un líder aleatorio para reportar la incidencia
            $reportingLeader = $leaders[$index % count($leaders)];
            
            Incident::create([
                'description' => $description,
                'status' => $status,
                'task_id' => $task->id,
                'reported_by_id' => $reportingLeader->id,
                'file_name' => null,
                'file_path' => null,
                'solution_task_id' => null,
                'created_at' => Carbon::now()->subDays(rand(1, 5)),
                'updated_at' => $status === 'Resolved' ? Carbon::now()->subDays(rand(0, 2)) : Carbon::now()->subDays(rand(1, 5)),
            ]);
        }

        $this->command->info('Incidencias creadas.');
    }
}

