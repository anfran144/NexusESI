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
        Schema::create('estados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->comment('Nombre del estado/departamento');
            $table->foreignId('pais_id')->constrained('paises')->onDelete('cascade')->comment('Referencia al país');
            $table->timestamps();

            // Índices para optimización de consultas
            $table->index('pais_id', 'idx_estados_pais_id');
            $table->index('nombre', 'idx_estados_nombre');

            // Índice único compuesto para evitar estados duplicados en el mismo país
            $table->unique(['nombre', 'pais_id'], 'unique_estado_pais');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estados');
    }
};
