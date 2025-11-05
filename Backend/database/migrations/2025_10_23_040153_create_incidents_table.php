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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->text('description');
            $table->enum('status', ['Reported', 'Resolved'])->default('Reported');
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('reported_by_id')->constrained('users')->onDelete('cascade');
            $table->string('file_name')->nullable();
            $table->string('file_path')->nullable();
            $table->foreignId('solution_task_id')->nullable()->constrained('tasks')->onDelete('set null');
            $table->timestamps();
            
            // Índices para optimización
            $table->index(['task_id', 'status']);
            $table->index(['reported_by_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
