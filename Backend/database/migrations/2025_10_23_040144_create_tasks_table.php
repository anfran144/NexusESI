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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->date('due_date');
            $table->enum('status', ['InProgress', 'Completed', 'Delayed', 'Paused'])->default('InProgress');
            $table->enum('risk_level', ['Low', 'Medium', 'High'])->default('Low');
            $table->foreignId('assigned_to_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('committee_id')->constrained('committees')->onDelete('cascade');
            $table->timestamps();
            
            // Índices para optimización
            $table->index(['committee_id', 'due_date']);
            $table->index(['assigned_to_id', 'status']);
            $table->index('risk_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
