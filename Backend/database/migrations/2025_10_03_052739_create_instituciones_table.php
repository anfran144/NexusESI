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
        Schema::create('instituciones', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 255)->comment('Nombre de la institución');
            $table->string('identificador', 100)->unique()->comment('Identificador único alfanumérico');
            $table->enum('estado', ['activo', 'inactivo'])->default('activo')->comment('Estado de la institución');
            $table->foreignId('ciudad_id')->constrained('ciudades')->onDelete('cascade')->comment('Referencia a la ciudad');
            $table->timestamps();

            // Índices para optimización
            $table->index('ciudad_id', 'idx_instituciones_ciudad_id');
            $table->index('nombre', 'idx_instituciones_nombre');
            $table->index(['ciudad_id', 'estado'], 'idx_instituciones_ciudad_estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instituciones');
    }
};
