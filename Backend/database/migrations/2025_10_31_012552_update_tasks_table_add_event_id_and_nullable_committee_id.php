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
        Schema::table('tasks', function (Blueprint $table) {
            // Agregar event_id antes de hacer committee_id nullable
            // event_id es requerido: si no hay committee_id, debe haber event_id
            $table->foreignId('event_id')->after('id')->constrained('events')->onDelete('cascade');
            
            // Hacer committee_id nullable (las tareas pueden ser del evento sin comité)
            $table->foreignId('committee_id')->nullable()->change();
            
            // Agregar índice para event_id
            $table->index(['event_id', 'due_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Remover índice de event_id
            $table->dropIndex(['event_id', 'due_date']);
            
            // Hacer committee_id no nullable nuevamente
            $table->foreignId('committee_id')->nullable(false)->change();
            
            // Remover event_id
            $table->dropForeign(['event_id']);
            $table->dropColumn('event_id');
        });
    }
};
