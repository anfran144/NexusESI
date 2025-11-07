<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('event_participants', function (Blueprint $table) {
            // Rol con el que participó en el evento
            $table->string('participation_role')->nullable()->after('event_id')
                ->comment('Rol con el que participó: seedbed_leader, coordinator');
            
            // Indicador de participación activa (false cuando el evento finaliza)
            $table->boolean('is_active')->default(true)->after('participation_role')
                ->comment('Indica si la participación está activa (evento no finalizado)');
            
            // Fecha en que finalizó la participación (cuando el evento finaliza)
            $table->timestamp('ended_at')->nullable()->after('is_active')
                ->comment('Fecha en que finalizó la participación (cuando el evento finaliza)');
            
            // Índices para búsquedas eficientes
            $table->index('participation_role');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_participants', function (Blueprint $table) {
            $table->dropIndex(['participation_role']);
            $table->dropIndex(['is_active']);
            $table->dropColumn(['participation_role', 'is_active', 'ended_at']);
        });
    }
};
