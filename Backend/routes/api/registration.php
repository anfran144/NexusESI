<?php

use App\Http\Controllers\Api\RegistrationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Registration Flow Routes
|--------------------------------------------------------------------------
|
| Rutas públicas específicas para el flujo de registro de usuarios:
| - Selectores en cascada (País → Estado → Ciudad → Institución)
| - Validación de instituciones disponibles
| - Estructura jerárquica para formularios
|
*/

// Todas las rutas de registro son públicas
Route::prefix('registration')->group(function () {
    // Selectores en cascada para el formulario de registro
    Route::get('/paises', [RegistrationController::class, 'getPaises']);
    Route::get('/estados/{paisId}', [RegistrationController::class, 'getEstadosByPais']);
    Route::get('/ciudades/{estadoId}', [RegistrationController::class, 'getCiudadesByEstado']);
    Route::get('/instituciones/{ciudadId}', [RegistrationController::class, 'getInstitucionesByCiudad']);

    // Estructura jerárquica completa (opcional, para debugging o carga inicial)
    Route::get('/hierarchy/{paisId?}', [RegistrationController::class, 'getHierarchicalStructure']);

    // Validación de institución antes del registro
    Route::get('/validate-institution/{institutionId}', [RegistrationController::class, 'validateInstitution']);
});
