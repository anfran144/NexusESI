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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->text('description');
            $table->date('start_date');
            $table->date('end_date');
            $table->foreignId('coordinator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('institution_id')->constrained('instituciones')->onDelete('cascade');
            $table->enum('status', ['planificación', 'en_progreso', 'finalizado', 'cancelado'])->default('planificación');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
