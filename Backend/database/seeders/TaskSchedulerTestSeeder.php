<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use App\Models\Event;
use App\Models\Committee;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TaskSchedulerTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Este seeder crea tareas para los usuarios id=2 (coordinador) y id=3 (lider)
     * con fechas que mañana serán detectadas como riesgo medio y alto por el scheduler.
     */
    public function run(): void
    {
        // Obtener usuarios específicos
        $coordinator = User::find(2);
        $leader = User::find(3);

        if (!$coordinator) {
            $this->command->warn('Usuario con id=2 (coordinador) no encontrado. Ejecuta primero el UserSeeder.');
            return;
        }

        if (!$leader) {
            $this->command->warn('Usuario con id=3 (líder) no encontrado. Ejecuta primero el UserSeeder.');
            return;
        }

        // Verificar que sean los roles correctos
        if (!$coordinator->hasRole('coordinator')) {
            $this->command->warn('Usuario id=2 no tiene rol de coordinador.');
        }

        if (!$leader->hasRole('seedbed_leader')) {
            $this->command->warn('Usuario id=3 no tiene rol de líder de semillero.');
        }

        // Obtener un evento existente o crear uno para las pruebas
        $event = Event::first();
        
        if (!$event) {
            $this->command->warn('No hay eventos disponibles. Creando uno de prueba...');
            
            // Crear un evento de prueba
            $institution = \App\Models\Institucion::first();
            if (!$institution) {
                $this->command->error('No hay instituciones disponibles. Ejecuta primero el InstitucionSeeder.');
                return;
            }

            $event = Event::create([
                'name' => 'Evento de Prueba para Scheduler',
                'description' => 'Evento creado automáticamente para pruebas del scheduler de tareas',
                'start_date' => Carbon::now()->addMonths(1),
                'end_date' => Carbon::now()->addMonths(1)->addDays(5),
                'coordinator_id' => $coordinator->id,
                'institution_id' => $institution->id,
                'status' => 'planificación',
            ]);
        }

        // Obtener un comité existente o crear uno
        $committee = Committee::where('event_id', $event->id)->first();
        
        if (!$committee) {
            $this->command->info('Creando comité de prueba...');
            $committee = Committee::create([
                'name' => 'Comité de Prueba - Scheduler',
                'event_id' => $event->id,
            ]);
        }

        // Calcular fechas para mañana
        $tomorrow = Carbon::tomorrow();
        
        // Para riesgo medio: mañana + 3 días (cuando se ejecute el scheduler mañana, tendrá 3 días restantes)
        $mediumRiskDueDate = $tomorrow->copy()->addDays(3);
        
        // Para riesgo alto: mañana + 1 día (cuando se ejecute el scheduler mañana, tendrá 1 día restante)
        $highRiskDueDate = $tomorrow->copy()->addDays(1);

        $this->command->info('Creando tareas de prueba para el scheduler...');
        $this->command->info("Fecha límite riesgo medio: {$mediumRiskDueDate->format('Y-m-d')}");
        $this->command->info("Fecha límite riesgo alto: {$highRiskDueDate->format('Y-m-d')}");

        // Crear tareas para el coordinador (id=2)
        Task::firstOrCreate(
            [
                'title' => 'Tarea Coordinador - Riesgo Medio (Scheduler Test)',
                'assigned_to_id' => $coordinator->id,
            ],
            [
                'description' => 'Esta tarea tiene riesgo medio. Cuando se ejecute el scheduler mañana, será detectada con 3 días restantes.',
                'due_date' => $mediumRiskDueDate->format('Y-m-d'),
                'status' => 'Delayed',
                'risk_level' => 'Medium',
                'committee_id' => $committee->id,
                'event_id' => $event->id,
            ]
        );

        Task::firstOrCreate(
            [
                'title' => 'Tarea Coordinador - Riesgo Alto (Scheduler Test)',
                'assigned_to_id' => $coordinator->id,
            ],
            [
                'description' => 'Esta tarea tiene riesgo alto. Cuando se ejecute el scheduler mañana, será detectada con 1 día restante.',
                'due_date' => $highRiskDueDate->format('Y-m-d'),
                'status' => 'Delayed',
                'risk_level' => 'High',
                'committee_id' => $committee->id,
                'event_id' => $event->id,
            ]
        );

        // Crear tareas para el líder (id=3)
        Task::firstOrCreate(
            [
                'title' => 'Tarea Líder - Riesgo Medio (Scheduler Test)',
                'assigned_to_id' => $leader->id,
            ],
            [
                'description' => 'Esta tarea tiene riesgo medio. Cuando se ejecute el scheduler mañana, será detectada con 3 días restantes.',
                'due_date' => $mediumRiskDueDate->format('Y-m-d'),
                'status' => 'Delayed',
                'risk_level' => 'Medium',
                'committee_id' => $committee->id,
                'event_id' => $event->id,
            ]
        );

        Task::firstOrCreate(
            [
                'title' => 'Tarea Líder - Riesgo Alto (Scheduler Test)',
                'assigned_to_id' => $leader->id,
            ],
            [
                'description' => 'Esta tarea tiene riesgo alto. Cuando se ejecute el scheduler mañana, será detectada con 1 día restante.',
                'due_date' => $highRiskDueDate->format('Y-m-d'),
                'status' => 'Delayed',
                'risk_level' => 'High',
                'committee_id' => $committee->id,
                'event_id' => $event->id,
            ]
        );

        $this->command->info('✅ Tareas de prueba creadas exitosamente:');
        $this->command->info("   - 2 tareas para Coordinador (id={$coordinator->id}): 1 riesgo medio, 1 riesgo alto");
        $this->command->info("   - 2 tareas para Líder (id={$leader->id}): 1 riesgo medio, 1 riesgo alto");
        $this->command->info('   - Todas las tareas están marcadas como "Delayed"');
        $this->command->info('');
        $this->command->info('📅 El scheduler ejecutará mañana y actualizará los niveles de riesgo automáticamente.');
        $this->command->info('   Puedes probar el scheduler manualmente con: php artisan tasks:calculate-risks');
    }
}

