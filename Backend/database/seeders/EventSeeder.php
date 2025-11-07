<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Institucion;
use App\Models\User;
use App\Models\Committee;
use App\Models\Task;
use App\Models\EventParticipant;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EventSeeder extends Seeder
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

        // Obtener Juan Pablo García como coordinador
        $juanPablo = User::where('email', 'juanpablo.garcia@nexusesi.com')->first();

        if (!$juanPablo) {
            $this->command->warn('Juan Pablo García no encontrado. Ejecuta primero UserSeeder.');
            return;
        }

        // Crear el evento "Encuentro de Semilleros Institucional 2025" como finalizado
        $evento2025 = Event::firstOrCreate(
            ['name' => 'Encuentro de Semilleros Institucional 2025'],
            [
                'description' => 'Evento anual de semilleros de investigación institucional. Fechas: 24 y 25 de Abril de 2025. Evento relacionado: Encuentro de Semilleros Departamental 2025 (14 y 15 de Mayo).',
                'start_date' => Carbon::create(2025, 4, 24),
                'end_date' => Carbon::create(2025, 4, 25),
                'coordinator_id' => $juanPablo->id,
                'institution_id' => $universidadMariana->id,
                'status' => 'finished',
            ]
        );

        $this->command->info('Evento "Encuentro de Semilleros Institucional 2025" creado/actualizado como finalizado.');

        // Crear comités y tareas para el evento 2025
        $usuarios = $this->createCommitteesAndTasks($evento2025, $juanPablo, $universidadMariana);

        // Crear participantes del evento con campos históricos
        $this->createEventParticipants($evento2025, $usuarios, $juanPablo);
    }

    /**
     * Crear comités y tareas para el evento 2025
     * 
     * @return array Array de usuarios creados
     */
    private function createCommitteesAndTasks(Event $event, User $coordinator, Institucion $institucion): array
    {
        // Crear usuarios para los miembros de los comités (si no existen)
        $miembros = [
            'Jhon Rodriguez Saavedra' => 'jhon.rodriguez@nexusesi.com',
            'Mauricio López' => 'mauricio.lopez@nexusesi.com',
            'Jennifer Jimenez' => 'jennifer.jimenez@nexusesi.com',
            'Rocio Moncayo' => 'rocio.moncayo@nexusesi.com',
            'Simón Puerchambud' => 'simon.puerchambud@nexusesi.com',
            'Esteban Jurado' => 'esteban.jurado@nexusesi.com',
            'Santiago Escandón' => 'santiago.escandon@nexusesi.com',
            'Jose Fernando Araujo' => 'jose.araujo@nexusesi.com',
            'Ginna Marcela Ardila' => 'ginna.ardila@nexusesi.com',
            'Ana María Cerón' => 'ana.ceron@nexusesi.com',
            'Nubia Gonzales' => 'nubia.gonzales@nexusesi.com',
            'Laurin Rengifo' => 'laurin.rengifo@nexusesi.com',
            'Fausto Escobar' => 'fausto.escobar@nexusesi.com',
            'Arturo Erazo' => 'arturo.erazo@nexusesi.com',
            'Diana Andrade' => 'diana.andrade@nexusesi.com',
            'Adriana Vera' => 'adriana.vera@nexusesi.com',
            'Cristina Ruiz' => 'cristina.ruiz@nexusesi.com',
            'Cristian Zambrano' => 'cristian.zambrano@nexusesi.com',
            'Merylin Ortega' => 'merylin.ortega@nexusesi.com',
        ];

        $usuarios = [];
        $seedbedLeaderRole = \Spatie\Permission\Models\Role::where('name', 'seedbed_leader')->first();
        
        foreach ($miembros as $nombre => $email) {
            $usuario = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $nombre,
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                    'status' => 'active',
                    'institution_id' => $institucion->id,
                ]
            );
            
            // Asignar rol de líder de semillero si no lo tiene
            if ($seedbedLeaderRole && !$usuario->hasRole('seedbed_leader')) {
                $usuario->assignRole($seedbedLeaderRole);
            }
            
            $usuarios[$nombre] = $usuario;
        }

        // Comité de Comunicaciones
        $comiteComunicaciones = Committee::firstOrCreate(
            ['name' => 'Comité de Comunicaciones', 'event_id' => $event->id]
        );
        
        $comiteComunicaciones->users()->syncWithoutDetaching([
            $usuarios['Jhon Rodriguez Saavedra']->id,
            $usuarios['Mauricio López']->id,
            $usuarios['Jennifer Jimenez']->id,
            $usuarios['Rocio Moncayo']->id,
            $coordinator->id, // Juan P. García
        ]);

        // Tareas del Comité de Comunicaciones
        $tareasComunicaciones = [
            ['title' => 'Actualizar los TDRs (Términos de Referencia)', 'description' => 'Actualizar los Términos de Referencia del evento', 'due_date' => Carbon::create(2025, 3, 15), 'status' => 'Completed'],
            ['title' => 'Gestionar Publicidad en página de noticias', 'description' => 'Coordinar la publicación de noticias sobre el evento', 'due_date' => Carbon::create(2025, 4, 1), 'status' => 'Completed'],
            ['title' => 'Gestionar Publicidad en Facebook', 'description' => 'Crear y gestionar publicaciones en redes sociales', 'due_date' => Carbon::create(2025, 4, 1), 'status' => 'Completed'],
            ['title' => 'Coordinar con la oficina de mercadeo y publicidad', 'description' => 'Establecer comunicación con la oficina de mercadeo', 'due_date' => Carbon::create(2025, 3, 20), 'status' => 'Completed'],
            ['title' => 'Definir el eslogan del evento', 'description' => 'Pendiente de definición', 'due_date' => Carbon::create(2025, 3, 25), 'status' => 'Paused'],
            ['title' => 'Asegurar cobertura fotográfica', 'description' => 'Pendiente de definición', 'due_date' => Carbon::create(2025, 4, 20), 'status' => 'Paused'],
        ];

        foreach ($tareasComunicaciones as $tareaData) {
            Task::firstOrCreate(
                [
                    'title' => $tareaData['title'],
                    'event_id' => $event->id,
                    'committee_id' => $comiteComunicaciones->id,
                ],
                [
                    'description' => $tareaData['description'],
                    'due_date' => $tareaData['due_date'],
                    'status' => $tareaData['status'],
                    'risk_level' => 'Low',
                ]
            );
        }

        // Comité de Logística
        $comiteLogistica = Committee::firstOrCreate(
            ['name' => 'Comité de Logística', 'event_id' => $event->id]
        );
        
        $comiteLogistica->users()->syncWithoutDetaching([
            $usuarios['Simón Puerchambud']->id,
            $usuarios['Esteban Jurado']->id,
            $usuarios['Santiago Escandón']->id,
            $coordinator->id, // Juan P. García
            $usuarios['Jose Fernando Araujo']->id,
            $usuarios['Ginna Marcela Ardila']->id,
            $usuarios['Ana María Cerón']->id,
        ]);

        // Tareas del Comité de Logística
        $tareasLogistica = [
            ['title' => 'Realizar la solicitud de TODOS los auditorios y aulas necesarios', 'description' => 'Solicitar todos los espacios necesarios para el evento', 'due_date' => Carbon::create(2025, 3, 1), 'status' => 'Completed'],
            ['title' => 'Consolidar la cantidad de proyectos en un Excel (para determinar aulas)', 'description' => 'Crear archivo Excel con la cantidad de proyectos', 'due_date' => Carbon::create(2025, 3, 10), 'status' => 'Completed'],
            ['title' => 'Reservar Aulas inteligentes', 'description' => 'Gestionar reserva de aulas inteligentes', 'due_date' => Carbon::create(2025, 3, 15), 'status' => 'Completed'],
            ['title' => 'Reservar Salas de biblioteca', 'description' => 'Gestionar reserva de salas de biblioteca', 'due_date' => Carbon::create(2025, 3, 15), 'status' => 'Completed'],
            ['title' => 'Reservar Auditorio Jesús de Nazareth', 'description' => 'Gestionar reserva del auditorio principal', 'due_date' => Carbon::create(2025, 3, 15), 'status' => 'Completed'],
            ['title' => 'Reservar Facultad de Derecho: Aula 202, sala de audiencia', 'description' => 'Gestionar reserva de espacios en la Facultad de Derecho', 'due_date' => Carbon::create(2025, 3, 15), 'status' => 'Completed'],
            ['title' => 'Elaborar la programación detallada del evento (hora a hora, lugar, conferencia)', 'description' => 'Crear programación completa del evento', 'due_date' => Carbon::create(2025, 4, 10), 'status' => 'Completed'],
            ['title' => 'Coordinar la conferencia inaugural (Ponente: Santiago)', 'description' => 'Coordinar con Santiago la conferencia inaugural', 'due_date' => Carbon::create(2025, 4, 15), 'status' => 'Completed'],
            ['title' => 'Definir la logística para 2 conferencias en 2 auditorios simultáneos', 'description' => 'Planificar logística para conferencias simultáneas', 'due_date' => Carbon::create(2025, 4, 10), 'status' => 'Completed'],
            ['title' => 'Contratar Conferencista(s)', 'description' => 'Requisitos: ORI (Oficina de Relaciones Internacionales), Nacional o Internacional, Interdisciplinar, NADA VIRTUAL', 'due_date' => Carbon::create(2025, 3, 30), 'status' => 'Paused'],
        ];

        foreach ($tareasLogistica as $tareaData) {
            Task::firstOrCreate(
                [
                    'title' => $tareaData['title'],
                    'event_id' => $event->id,
                    'committee_id' => $comiteLogistica->id,
                ],
                [
                    'description' => $tareaData['description'],
                    'due_date' => $tareaData['due_date'],
                    'status' => $tareaData['status'],
                    'risk_level' => 'Low',
                ]
            );
        }

        // Comité de Evaluación (Científico)
        $comiteEvaluacion = Committee::firstOrCreate(
            ['name' => 'Comité de Evaluación', 'event_id' => $event->id]
        );
        
        $comiteEvaluacion->users()->syncWithoutDetaching([
            $coordinator->id, // Juan P. García
            $usuarios['Nubia Gonzales']->id,
            $usuarios['Laurin Rengifo']->id,
            $usuarios['Fausto Escobar']->id,
            $usuarios['Arturo Erazo']->id,
        ]);

        // Tareas del Comité de Evaluación
        $tareasEvaluacion = [
            ['title' => 'Diseñar el proceso de "Concentración de calificaciones"', 'description' => 'Crear proceso para concentrar calificaciones', 'due_date' => Carbon::create(2025, 3, 20), 'status' => 'Completed'],
            ['title' => 'Diseñar el proceso de "Presentación de calificaciones"', 'description' => 'Crear proceso para presentar calificaciones', 'due_date' => Carbon::create(2025, 3, 20), 'status' => 'Completed'],
            ['title' => 'Garantizar que cada líder contacte a los jurados', 'description' => 'Coordinar contacto con jurados', 'due_date' => Carbon::create(2025, 4, 1), 'status' => 'Completed'],
            ['title' => 'Garantizar dos evaluaciones por proyecto', 'description' => 'Tarea asignada a cada líder de comité', 'due_date' => Carbon::create(2025, 4, 5), 'status' => 'Completed'],
            ['title' => 'Realizar capacitación para evaluadores con video', 'description' => 'Crear y difundir video de capacitación', 'due_date' => Carbon::create(2025, 3, 25), 'status' => 'Completed'],
            ['title' => 'Definir los "Formatos de evaluación"', 'description' => 'Requisitos: mostrar acumulado después de cada punto, incluir pre-informe antes de enviar, adicionar casilla "SI AVALA PARA PRESENTAR AL REGIONAL"', 'due_date' => Carbon::create(2025, 3, 15), 'status' => 'Paused'],
        ];

        foreach ($tareasEvaluacion as $tareaData) {
            Task::firstOrCreate(
                [
                    'title' => $tareaData['title'],
                    'event_id' => $event->id,
                    'committee_id' => $comiteEvaluacion->id,
                ],
                [
                    'description' => $tareaData['description'],
                    'due_date' => $tareaData['due_date'],
                    'status' => $tareaData['status'],
                    'risk_level' => 'Low',
                ]
            );
        }

        // Comité de Certificados
        $comiteCertificados = Committee::firstOrCreate(
            ['name' => 'Comité de Certificados', 'event_id' => $event->id]
        );
        
        $comiteCertificados->users()->syncWithoutDetaching([
            $usuarios['Diana Andrade']->id,
            $usuarios['Adriana Vera']->id,
            $usuarios['Cristina Ruiz']->id,
            $usuarios['Cristian Zambrano']->id,
            $usuarios['Merylin Ortega']->id,
        ]);

        // Tarea del Comité de Certificados
        Task::firstOrCreate(
            [
                'title' => 'Proyectar (diseñar y preparar) los certificados de todos los participantes',
                'event_id' => $event->id,
                'committee_id' => $comiteCertificados->id,
            ],
            [
                'description' => 'Diseñar y preparar todos los certificados necesarios',
                'due_date' => Carbon::create(2025, 4, 20),
                'status' => 'Completed',
                'risk_level' => 'Low',
            ]
        );

        // Tareas Generales (sin comité específico)
        $tareasGenerales = [
            ['title' => 'Actualizar los TDR de la convocatoria', 'description' => 'Tarea colectiva - Actualizar TDR de la convocatoria', 'due_date' => Carbon::create(2025, 3, 1), 'status' => 'Completed'],
            ['title' => 'Tomar decisión sobre la publicación de resultados', 'description' => 'Pendiente de decisión', 'due_date' => Carbon::create(2025, 4, 20), 'status' => 'Paused'],
            ['title' => 'Definir el proceso de inscripción', 'description' => 'Incompleto - Definir proceso completo de inscripción', 'due_date' => Carbon::create(2025, 3, 10), 'status' => 'Paused'],
        ];

        foreach ($tareasGenerales as $tareaData) {
            Task::firstOrCreate(
                [
                    'title' => $tareaData['title'],
                    'event_id' => $event->id,
                    'committee_id' => null, // Sin comité
                ],
                [
                    'description' => $tareaData['description'],
                    'due_date' => $tareaData['due_date'],
                    'status' => $tareaData['status'],
                    'risk_level' => 'Low',
                ]
            );
        }

        $this->command->info('Comités y tareas creados para el evento 2025.');

        return $usuarios;
    }

    /**
     * Crear participantes del evento con campos históricos
     */
    private function createEventParticipants(Event $event, array $usuarios, User $coordinator): void
    {
        // Como el evento está finalizado, todos los participantes deben estar inactivos
        $isActive = false;
        $endedAt = $event->end_date->copy()->endOfDay();

        // Crear participante para el coordinador
        EventParticipant::firstOrCreate(
            [
                'user_id' => $coordinator->id,
                'event_id' => $event->id,
            ],
            [
                'participation_role' => 'coordinator',
                'is_active' => $isActive,
                'ended_at' => $endedAt,
            ]
        );

        // Crear participantes para todos los líderes de semillero
        foreach ($usuarios as $usuario) {
            EventParticipant::firstOrCreate(
                [
                    'user_id' => $usuario->id,
                    'event_id' => $event->id,
                ],
                [
                    'participation_role' => 'seedbed_leader',
                    'is_active' => $isActive,
                    'ended_at' => $endedAt,
                ]
            );
        }

        $totalParticipants = count($usuarios) + 1; // +1 por el coordinador
        $this->command->info("Participantes del evento creados: {$totalParticipants} (1 coordinador + " . count($usuarios) . " líderes de semillero).");
    }
}
