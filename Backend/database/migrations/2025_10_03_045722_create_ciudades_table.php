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
        Schema::create('ciudades', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->comment('Nombre de la ciudad');
            $table->foreignId('estado_id')->constrained('estados')->onDelete('cascade')->comment('Referencia al estado/departamento');
            $table->timestamps();

            // Índices para optimización de consultas
            $table->index('estado_id', 'idx_ciudades_estado_id');
            $table->index('nombre', 'idx_ciudades_nombre');

            // Índice único compuesto para evitar ciudades duplicadas en el mismo estado
            $table->unique(['nombre', 'estado_id'], 'unique_ciudad_estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ciudades');
    }
};
