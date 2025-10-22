<?php

use App\Http\Controllers\Api\LocationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Geographic Locations Routes
|--------------------------------------------------------------------------
|
| Rutas públicas para la gestión de ubicaciones geográficas:
| - Países, estados y ciudades
| - Estructura jerárquica
| - Búsqueda de ubicaciones
|
*/

// Todas las rutas de ubicaciones son públicas
Route::prefix('locations')->group(function () {
    Route::get('/paises', [LocationController::class, 'getPaises']);
    Route::get('/estados/{paisId}', [LocationController::class, 'getEstadosByPais']);
    Route::get('/ciudades/estado/{estadoId}', [LocationController::class, 'getCiudadesByEstado']);
    Route::get('/ciudades/pais/{paisId}', [LocationController::class, 'getCiudadesByPais']);
    Route::get('/hierarchy/{paisId?}', [LocationController::class, 'getHierarchicalStructure']);
    Route::get('/search', [LocationController::class, 'searchLocations']);
});
