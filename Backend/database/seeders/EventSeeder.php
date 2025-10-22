<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Institucion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener coordinadores e instituciones existentes
        $coordinators = User::role('coordinator')->get();
        $institutions = Institucion::all();

        if ($coordinators->isEmpty() || $institutions->isEmpty()) {
            $this->command->warn('No hay coordinadores o instituciones disponibles. Ejecuta primero los seeders de usuarios e instituciones.');

            return;
        }

        $events = [
            [
                'name' => 'Congreso Nacional de Ingeniería de Sistemas 2024',
                'description' => 'Evento académico que reúne a estudiantes, docentes y profesionales del área de ingeniería de sistemas para compartir conocimientos, investigaciones y experiencias en las últimas tendencias tecnológicas.',
                'start_date' => Carbon::now()->addMonths(2),
                'end_date' => Carbon::now()->addMonths(2)->addDays(3),
                'status' => 'planificación',
            ],
            [
                'name' => 'Hackathon Innovación Tecnológica',
                'description' => 'Competencia de programación de 48 horas donde equipos multidisciplinarios desarrollan soluciones innovadoras a problemas reales utilizando tecnologías emergentes.',
                'start_date' => Carbon::now()->addMonth(),
                'end_date' => Carbon::now()->addMonth()->addDays(2),
                'status' => 'planificación',
            ],
            [
                'name' => 'Seminario de Inteligencia Artificial y Machine Learning',
                'description' => 'Seminario especializado en las aplicaciones prácticas de IA y ML en diferentes industrias, con talleres hands-on y conferencias magistrales.',
                'start_date' => Carbon::now()->addWeeks(3),
                'end_date' => Carbon::now()->addWeeks(3)->addDay(),
                'status' => 'planificación',
            ],
            [
                'name' => 'Foro de Emprendimiento Digital',
                'description' => 'Espacio de encuentro entre emprendedores, inversionistas y estudiantes para promover el ecosistema de startups tecnológicas y la innovación digital.',
                'start_date' => Carbon::now()->addMonths(3),
                'end_date' => Carbon::now()->addMonths(3)->addDay(),
                'status' => 'planificación',
            ],
            [
                'name' => 'Workshop de Desarrollo Web Full Stack',
                'description' => 'Taller intensivo de desarrollo web que cubre desde fundamentos de frontend hasta arquitecturas de backend modernas, incluyendo frameworks actuales.',
                'start_date' => Carbon::now()->addWeeks(6),
                'end_date' => Carbon::now()->addWeeks(6)->addDays(4),
                'status' => 'planificación',
            ],
        ];

        foreach ($events as $eventData) {
            Event::create([
                'name' => $eventData['name'],
                'description' => $eventData['description'],
                'start_date' => $eventData['start_date'],
                'end_date' => $eventData['end_date'],
                'coordinator_id' => $coordinators->random()->id,
                'institution_id' => $institutions->random()->id,
                'status' => $eventData['status'],
            ]);
        }

        $this->command->info('Eventos de prueba creados exitosamente.');
    }
}
