<?php

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Incluir rutas de autenticación
require __DIR__.'/api/auth.php';

// Incluir rutas de registro con selectores en cascada
require __DIR__.'/api/registration.php';

// Incluir rutas de forgot password
require __DIR__.'/api/forgot-password.php';

// Incluir rutas de verificación de email
require __DIR__.'/api/email-verification.php';

// Incluir rutas protegidas
require __DIR__.'/api/protected.php';

// Incluir rutas de administración
require __DIR__.'/api/admin.php';

// Incluir rutas de gestión de permisos
require __DIR__.'/api/permissions.php';

// Incluir rutas del sistema de eventos
require __DIR__.'/api/events.php';

// Otras rutas públicas
require __DIR__.'/api/users.php';
require __DIR__.'/api/roles.php';
require __DIR__.'/api/locations.php';
require __DIR__.'/api/institutions.php';
require __DIR__.'/api/utilities.php';
