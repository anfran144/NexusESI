<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Utility Routes
|--------------------------------------------------------------------------
|
| Rutas de utilidades del sistema:
| - Health check
| - Información del sistema
| - Rutas de diagnóstico
|
*/

// Ruta de prueba para verificar que la API funciona
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API funcionando correctamente',
        'timestamp' => now(),
        'version' => '1.0.0',
    ]);
});
