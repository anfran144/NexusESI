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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');                           // Título corto
            $table->text('message')->nullable();               // Mensaje detallado
            $table->enum('type', [
                'alert',           // Alerta de riesgo (from alerts table)
                'progress',        // Reporte de progreso
                'incident',        // Incidencia reportada
                'task_update',     // Actualización de tarea
                'info'             // Notificación general
            ])->default('info');
            
            // Usuario que recibe la notificación
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Relaciones polimórficas para vincular con diferentes entidades
            $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('cascade');
            $table->foreignId('progress_id')->nullable()->constrained('task_progress')->onDelete('cascade');
            $table->foreignId('incident_id')->nullable()->constrained('incidents')->onDelete('cascade');
            $table->foreignId('alert_id')->nullable()->constrained('alerts')->onDelete('cascade');
            
            // Estado de lectura
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            
            // Datos adicionales en JSON (para flexibilidad)
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            // Índices para optimización
            $table->index(['user_id', 'is_read']);
            $table->index(['user_id', 'created_at']);
            $table->index(['type', 'is_read']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
