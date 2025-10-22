<?php

use App\Http\Controllers\Api\InstitucionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Institutions Routes
|--------------------------------------------------------------------------
|
| Rutas públicas para la gestión de instituciones:
| - CRUD de instituciones
| - Búsqueda por ubicación geográfica
| - Estructura jerárquica
| - Estadísticas
|
*/

// Todas las rutas de instituciones son públicas
Route::prefix('institutions')->group(function () {
    Route::get('/', [InstitucionController::class, 'index']);
    Route::get('/{id}', [InstitucionController::class, 'show']);
    Route::get('/city/{ciudadId}', [InstitucionController::class, 'porCiudad']);
    Route::get('/state/{estadoId}', [InstitucionController::class, 'porEstado']);
    Route::get('/country/{paisId}', [InstitucionController::class, 'porPais']);
    Route::get('/search/query', [InstitucionController::class, 'buscar']);
    Route::get('/hierarchy/structure', [InstitucionController::class, 'estructuraJerarquica']);
    Route::get('/statistics/overview', [InstitucionController::class, 'estadisticas']);
});
