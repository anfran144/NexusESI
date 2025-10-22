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
        Schema::table('users', function (Blueprint $table) {
            // Agregar columna institution_id con clave foránea
            $table->foreignId('institution_id')
                ->nullable()
                ->constrained('instituciones')
                ->onDelete('cascade')
                ->comment('Referencia a la institución del usuario');

            // Agregar columna status con valores ENUM
            $table->enum('status', ['pending_approval', 'active', 'suspended'])
                ->default('pending_approval')
                ->comment('Estado del usuario en el sistema');

            // Índices para optimización de consultas
            $table->index('institution_id', 'idx_users_institution_id');
            $table->index('status', 'idx_users_status');
            $table->index(['institution_id', 'status'], 'idx_users_institution_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Eliminar índices primero
            $table->dropIndex('idx_users_institution_status');
            $table->dropIndex('idx_users_status');
            $table->dropIndex('idx_users_institution_id');

            // Eliminar clave foránea y columnas
            $table->dropForeign(['institution_id']);
            $table->dropColumn(['institution_id', 'status']);
        });
    }
};
