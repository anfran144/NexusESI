<?php

namespace App\Console\Commands;

use App\Models\EventParticipant;
use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateEventParticipantsHistory extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:migrate-participants-history';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migra los datos existentes de event_participants para agregar campos históricos (participation_role, is_active, ended_at)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🚀 Iniciando migración de datos históricos de participantes...');

        // Obtener todos los participantes que no tienen participation_role
        $participantsWithoutRole = EventParticipant::whereNull('participation_role')
            ->orWhere('participation_role', '')
            ->get();

        if ($participantsWithoutRole->isEmpty()) {
            $this->info('✅ No hay participantes que necesiten migración.');
            return Command::SUCCESS;
        }

        $this->info("📊 Encontrados {$participantsWithoutRole->count()} participantes para migrar.");

        $bar = $this->output->createProgressBar($participantsWithoutRole->count());
        $bar->start();

        $migrated = 0;
        $errors = 0;

        DB::beginTransaction();

        try {
            foreach ($participantsWithoutRole as $participant) {
                try {
                    // Cargar relaciones necesarias
                    $participant->load(['user', 'event']);

                    if (!$participant->user) {
                        $this->warn("\n⚠️  Participante ID {$participant->id} no tiene usuario asociado. Saltando...");
                        $errors++;
                        $bar->advance();
                        continue;
                    }

                    if (!$participant->event) {
                        $this->warn("\n⚠️  Participante ID {$participant->id} no tiene evento asociado. Saltando...");
                        $errors++;
                        $bar->advance();
                        continue;
                    }

                    // Determinar el rol de participación basado en el rol actual del usuario
                    $participationRole = 'seedbed_leader'; // Por defecto
                    
                    if ($participant->user->hasRole('coordinator')) {
                        $participationRole = 'coordinator';
                    } elseif ($participant->user->hasRole('seedbed_leader')) {
                        $participationRole = 'seedbed_leader';
                    }

                    // Determinar si está activo basándose en el estado del evento
                    $isActive = true;
                    $endedAt = null;

                    if ($participant->event->status === 'finished') {
                        $isActive = false;
                        // Usar la fecha de fin del evento como ended_at, o la fecha actual si no está disponible
                        $endedAt = $participant->event->end_date 
                            ? $participant->event->end_date->copy()->endOfDay()
                            : now();
                    }

                    // Actualizar el participante
                    $participant->update([
                        'participation_role' => $participationRole,
                        'is_active' => $isActive,
                        'ended_at' => $endedAt,
                    ]);

                    $migrated++;
                } catch (\Exception $e) {
                    $this->error("\n❌ Error migrando participante ID {$participant->id}: " . $e->getMessage());
                    $errors++;
                }

                $bar->advance();
            }

            DB::commit();
            $bar->finish();

            $this->newLine(2);
            $this->info("✅ Migración completada:");
            $this->info("   - Migrados: {$migrated}");
            $this->info("   - Errores: {$errors}");

            return Command::SUCCESS;
        } catch (\Exception $e) {
            DB::rollBack();
            $bar->finish();
            $this->newLine(2);
            $this->error("❌ Error durante la migración: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
