<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Primero, cambiar temporalmente la columna para permitir los valores antiguos
        Schema::table('events', function (Blueprint $table) {
            $table->string('status')->change();
        });

        // Actualizar los valores de status existentes
        DB::table('events')->where('status', 'planificación')->update(['status' => 'active']);
        DB::table('events')->where('status', 'en_progreso')->update(['status' => 'inactive']);
        DB::table('events')->where('status', 'finalizado')->update(['status' => 'finished']);
        DB::table('events')->where('status', 'cancelado')->update(['status' => 'finished']);

        // Restaurar la columna con el nuevo enum
        Schema::table('events', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive', 'finished'])->default('active')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cambiar temporalmente la columna para permitir los valores antiguos
        Schema::table('events', function (Blueprint $table) {
            $table->string('status')->change();
        });

        // Revertir los cambios
        DB::table('events')->where('status', 'active')->update(['status' => 'planificación']);
        DB::table('events')->where('status', 'inactive')->update(['status' => 'en_progreso']);
        DB::table('events')->where('status', 'finished')->update(['status' => 'finalizado']);

        // Restaurar la columna con el enum original
        Schema::table('events', function (Blueprint $table) {
            $table->enum('status', ['planificación', 'en_progreso', 'finalizado', 'cancelado'])->default('planificación')->change();
        });
    }
};
