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
        // Actualizar el enum para incluir 'Pending' y cambiar el default
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('Pending', 'InProgress', 'Completed', 'Delayed', 'Paused') DEFAULT 'Pending'");
        
        // Actualizar todas las tareas existentes sin asignar a 'Pending'
        DB::table('tasks')
            ->whereNull('assigned_to_id')
            ->where('status', 'InProgress')
            ->update(['status' => 'Pending']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Actualizar todas las tareas 'Pending' a 'InProgress' antes de remover el enum
        DB::table('tasks')
            ->where('status', 'Pending')
            ->update(['status' => 'InProgress']);
        
        // Revertir el enum al original
        DB::statement("ALTER TABLE tasks MODIFY COLUMN status ENUM('InProgress', 'Completed', 'Delayed', 'Paused') DEFAULT 'InProgress'");
    }
};
