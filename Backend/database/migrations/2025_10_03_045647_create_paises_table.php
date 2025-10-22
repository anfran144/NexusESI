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
        Schema::create('paises', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique()->comment('Nombre del país');
            $table->char('codigo_iso', 3)->unique()->comment('Código ISO 3166-1 alpha-3');
            $table->timestamps();

            // Índices para optimización de consultas
            $table->index('codigo_iso', 'idx_paises_codigo_iso');
            $table->index('nombre', 'idx_paises_nombre');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paises');
    }
};
