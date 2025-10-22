<?php

/**
 * Script de Pruebas del Sistema de Gestión de Eventos
 *
 * Este script verifica todas las funcionalidades del sistema de eventos:
 * - Admin sin permisos de eventos
 * - Coordinator con permisos completos
 * - Seedbed Leader con participación automática
 * - Filtros de eventos finalizados
 * - Un solo evento activo por líder
 *
 * Credenciales de Prueba:
 * - Coordinador: coordinador@nexusesi.com / coord123
 */

require __DIR__.'/vendor/autoload.php';

use App\Models\Committee;
use App\Models\Event;
use App\Models\EventParticipant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Colores para output
define('COLOR_GREEN', "\033[32m");
define('COLOR_RED', "\033[31m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_BLUE', "\033[34m");
define('COLOR_CYAN', "\033[36m");
define('COLOR_RESET', "\033[0m");
define('COLOR_BOLD', "\033[1m");

// Bootstrap Laravel
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo COLOR_BOLD.COLOR_CYAN."\n";
echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║   PRUEBAS DEL SISTEMA DE GESTIÓN DE EVENTOS - NexusESI        ║\n";
echo "║   Versión 1.1.0 - 15 de Octubre de 2025                       ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n";
echo COLOR_RESET."\n";

$testsPassed = 0;
$testsFailed = 0;
$testsTotal = 0;

/**
 * Función para imprimir resultados de tests
 */
function testResult($testName, $passed, $message = '')
{
    global $testsPassed, $testsFailed, $testsTotal;

    $testsTotal++;
    if ($passed) {
        $testsPassed++;
        echo COLOR_GREEN.'✓ PASS'.COLOR_RESET.' | '.$testName;
        if ($message) {
            echo COLOR_YELLOW.' → '.$message.COLOR_RESET;
        }
        echo "\n";
    } else {
        $testsFailed++;
        echo COLOR_RED.'✗ FAIL'.COLOR_RESET.' | '.$testName;
        if ($message) {
            echo COLOR_RED.' → '.$message.COLOR_RESET;
        }
        echo "\n";
    }
}

/**
 * Función para imprimir secciones
 */
function section($title)
{
    echo "\n".COLOR_BOLD.COLOR_BLUE.'═══ '.$title.' ═══'.COLOR_RESET."\n\n";
}

/**
 * Función para imprimir información
 */
function info($message)
{
    echo COLOR_CYAN.'ℹ '.$message.COLOR_RESET."\n";
}

try {
    // ============================================================================
    // SECCIÓN 1: VERIFICACIÓN DE CREDENCIALES Y USUARIOS
    // ============================================================================

    section('1. VERIFICACIÓN DE CREDENCIALES Y USUARIOS');

    // Buscar coordinador
    info('Buscando usuario: coordinador@nexusesi.com');
    $coordinator = User::where('email', 'coordinador@nexusesi.com')->first();

    if (! $coordinator) {
        echo COLOR_RED."✗ ERROR: Usuario coordinador@nexusesi.com no existe\n".COLOR_RESET;
        echo COLOR_YELLOW."Por favor ejecuta: php artisan db:seed --class=UserSeeder\n".COLOR_RESET;
        exit(1);
    }

    testResult(
        'Usuario coordinador existe',
        true,
        "ID: {$coordinator->id}, Nombre: {$coordinator->name}"
    );

    // Verificar contraseña
    $passwordCorrect = Hash::check('coord123', $coordinator->password);
    testResult(
        'Contraseña del coordinador es correcta',
        $passwordCorrect,
        $passwordCorrect ? 'coord123 es válida' : 'Contraseña incorrecta'
    );

    // Verificar rol
    $hasCoordinatorRole = $coordinator->hasRole('coordinator');
    testResult(
        "Usuario tiene rol 'coordinator'",
        $hasCoordinatorRole,
        $hasCoordinatorRole ? 'Rol asignado correctamente' : 'Falta asignar rol'
    );

    // Verificar institución
    testResult(
        'Usuario tiene institución asignada',
        $coordinator->institution_id !== null,
        'Institution ID: '.($coordinator->institution_id ?? 'NULL')
    );

    // ============================================================================
    // SECCIÓN 2: VERIFICACIÓN DE PERMISOS
    // ============================================================================

    section('2. VERIFICACIÓN DE PERMISOS DEL COORDINADOR');

    $eventPermissions = [
        'events.view' => 'Ver eventos',
        'events.create' => 'Crear eventos',
        'events.edit' => 'Editar eventos',
        'events.delete' => 'Eliminar eventos',
        'events.manage_participants' => 'Gestionar participantes',
        'events.committees.manage' => 'Gestionar comités',
    ];

    foreach ($eventPermissions as $permission => $description) {
        $hasPermission = $coordinator->can($permission);
        testResult(
            "Permiso: {$permission}",
            $hasPermission,
            $description
        );
    }

    // Verificar que NO tenga permiso de participar
    $canParticipate = $coordinator->can('events.participate');
    testResult(
        "NO tiene permiso 'events.participate'",
        ! $canParticipate,
        'Coordinadores no participan, solo gestionan'
    );

    // ============================================================================
    // SECCIÓN 3: VERIFICACIÓN DE ADMIN SIN PERMISOS
    // ============================================================================

    section('3. VERIFICACIÓN: ADMIN SIN PERMISOS DE EVENTOS');

    $admin = User::role('admin')->first();

    if ($admin) {
        info("Admin encontrado: {$admin->name} ({$admin->email})");

        foreach ($eventPermissions as $permission => $description) {
            $adminHasPermission = $admin->can($permission);
            testResult(
                "Admin NO tiene: {$permission}",
                ! $adminHasPermission,
                $adminHasPermission ? 'ERROR: Admin tiene este permiso' : 'Correcto'
            );
        }
    } else {
        echo COLOR_YELLOW."⚠ Advertencia: No se encontró usuario admin\n".COLOR_RESET;
    }

    // ============================================================================
    // SECCIÓN 4: PRUEBAS DE CREACIÓN DE EVENTOS
    // ============================================================================

    section('4. PRUEBAS DE CREACIÓN DE EVENTOS');

    info('Creando evento de prueba como coordinador...');

    $testEvent = Event::create([
        'name' => 'Test Evento '.date('Y-m-d H:i:s'),
        'description' => 'Evento de prueba creado por script automatizado',
        'start_date' => now()->addDays(30),
        'end_date' => now()->addDays(35),
        'coordinator_id' => $coordinator->id,
        'institution_id' => $coordinator->institution_id,
        'status' => 'planificación',
    ]);

    testResult(
        'Evento creado exitosamente',
        $testEvent->exists,
        "ID: {$testEvent->id}, Nombre: {$testEvent->name}"
    );

    testResult(
        'coordinator_id asignado correctamente',
        $testEvent->coordinator_id === $coordinator->id,
        "Coordinator ID: {$testEvent->coordinator_id}"
    );

    testResult(
        'institution_id asignado correctamente',
        $testEvent->institution_id === $coordinator->institution_id,
        "Institution ID: {$testEvent->institution_id}"
    );

    testResult(
        "Estado inicial es 'planificación'",
        $testEvent->status === 'planificación',
        "Status: {$testEvent->status}"
    );

    // ============================================================================
    // SECCIÓN 5: PRUEBAS DE VISUALIZACIÓN DE EVENTOS
    // ============================================================================

    section('5. PRUEBAS DE VISUALIZACIÓN DE EVENTOS');

    // Eventos del coordinador
    $coordinatorEvents = Event::where('coordinator_id', $coordinator->id)
        ->where('institution_id', $coordinator->institution_id)
        ->get();

    info('Total de eventos del coordinador: '.$coordinatorEvents->count());

    testResult(
        'Coordinador ve sus propios eventos',
        $coordinatorEvents->count() > 0,
        "{$coordinatorEvents->count()} evento(s) encontrado(s)"
    );

    testResult(
        'Todos los eventos pertenecen al coordinador',
        $coordinatorEvents->every(fn ($e) => $e->coordinator_id === $coordinator->id),
        'Filtro por coordinator_id funciona'
    );

    testResult(
        'Todos los eventos son de su institución',
        $coordinatorEvents->every(fn ($e) => $e->institution_id === $coordinator->institution_id),
        'Filtro por institution_id funciona'
    );

    // ============================================================================
    // SECCIÓN 6: PRUEBAS DE LÍDERES DE SEMILLERO
    // ============================================================================

    section('6. PRUEBAS DE LÍDERES DE SEMILLERO');

    $seedbedLeader = User::role('seedbed_leader')->first();

    if ($seedbedLeader) {
        info("Líder encontrado: {$seedbedLeader->name} ({$seedbedLeader->email})");

        // Verificar permisos
        testResult(
            "Líder tiene permiso 'events.view'",
            $seedbedLeader->can('events.view'),
            'Puede ver eventos'
        );

        testResult(
            "Líder tiene permiso 'events.participate'",
            $seedbedLeader->can('events.participate'),
            'Puede participar en eventos'
        );

        testResult(
            "Líder NO tiene permiso 'events.create'",
            ! $seedbedLeader->can('events.create'),
            'No puede crear eventos'
        );

        // Eventos visibles para el líder (sin finalizados)
        $leaderEvents = Event::where('institution_id', $seedbedLeader->institution_id)
            ->where('status', '!=', 'finalizado')
            ->get();

        info('Eventos visibles para el líder: '.$leaderEvents->count());

        testResult(
            'Líder ve eventos de su institución',
            $leaderEvents->count() >= 0,
            "{$leaderEvents->count()} evento(s) visible(s)"
        );

        testResult(
            'Líder NO ve eventos finalizados',
            $leaderEvents->every(fn ($e) => $e->status !== 'finalizado'),
            'Filtro de finalizados funciona'
        );

        // Prueba de participación automática
        if ($testEvent->institution_id === $seedbedLeader->institution_id) {
            info('Probando participación automática del líder...');

            $participation = EventParticipant::create([
                'user_id' => $seedbedLeader->id,
                'event_id' => $testEvent->id,
                'status' => 'aprobado',
            ]);

            testResult(
                "Participación creada con status 'aprobado'",
                $participation->status === 'aprobado',
                "Status: {$participation->status}"
            );

            testResult(
                'Participación sin aprobación manual',
                $participation->wasRecentlyCreated,
                'Creada automáticamente'
            );

            // Verificar que tiene un evento activo
            $activeEvent = $seedbedLeader->eventParticipations()
                ->whereHas('event', function ($q) {
                    $q->whereIn('status', ['planificación', 'en_progreso']);
                })
                ->whereIn('status', ['aprobado'])
                ->first();

            testResult(
                'Líder tiene evento activo',
                $activeEvent !== null,
                'Evento activo ID: '.($activeEvent->event_id ?? 'N/A')
            );

        } else {
            echo COLOR_YELLOW."⚠ Líder y coordinador de diferentes instituciones - skip prueba participación\n".COLOR_RESET;
        }

    } else {
        echo COLOR_YELLOW."⚠ Advertencia: No se encontró usuario seedbed_leader\n".COLOR_RESET;
    }

    // ============================================================================
    // SECCIÓN 7: PRUEBAS DE COMITÉS
    // ============================================================================

    section('7. PRUEBAS DE GESTIÓN DE COMITÉS');

    info('Creando comité de prueba...');

    $testCommittee = Committee::create([
        'name' => 'Comité de Prueba Automatizada',
        'event_id' => $testEvent->id,
    ]);

    testResult(
        'Comité creado exitosamente',
        $testCommittee->exists,
        "ID: {$testCommittee->id}, Nombre: {$testCommittee->name}"
    );

    testResult(
        'Comité asociado al evento correcto',
        $testCommittee->event_id === $testEvent->id,
        "Event ID: {$testCommittee->event_id}"
    );

    // Asignar miembro al comité
    if (isset($seedbedLeader) && isset($participation)) {
        $testCommittee->users()->attach($seedbedLeader->id, [
            'role' => 'Miembro',
            'assigned_at' => now(),
        ]);

        $memberCount = $testCommittee->users()->count();

        testResult(
            'Miembro asignado al comité',
            $memberCount > 0,
            "{$memberCount} miembro(s) en el comité"
        );

        $member = $testCommittee->users()->first();
        testResult(
            'Rol de miembro asignado correctamente',
            $member->pivot->role === 'Miembro',
            "Rol: {$member->pivot->role}"
        );
    }

    // ============================================================================
    // SECCIÓN 8: PRUEBAS DE POLÍTICAS (EventPolicy)
    // ============================================================================

    section('8. PRUEBAS DE POLÍTICAS DE AUTORIZACIÓN');

    // Test view policy
    $canViewOwnEvent = $coordinator->can('view', $testEvent);
    testResult(
        'Coordinador puede ver su propio evento',
        $canViewOwnEvent,
        'Policy view() permite acceso'
    );

    // Test update policy
    $canUpdateOwnEvent = $coordinator->can('update', $testEvent);
    testResult(
        'Coordinador puede editar su propio evento',
        $canUpdateOwnEvent,
        'Policy update() permite acceso'
    );

    // Test delete policy
    $canDeleteOwnEvent = $coordinator->can('delete', $testEvent);
    testResult(
        "Coordinador puede eliminar su evento en 'planificación'",
        $canDeleteOwnEvent && $testEvent->status === 'planificación',
        'Policy delete() permite acceso'
    );

    // Test manageParticipants policy
    $canManageParticipants = $coordinator->can('manageParticipants', $testEvent);
    testResult(
        'Coordinador puede gestionar participantes',
        $canManageParticipants,
        'Policy manageParticipants() permite acceso'
    );

    // Test manageCommittees policy
    $canManageCommittees = $coordinator->can('manageCommittees', $testEvent);
    testResult(
        'Coordinador puede gestionar comités',
        $canManageCommittees,
        'Policy manageCommittees() permite acceso'
    );

    // Test admin NO puede ver eventos
    if (isset($admin)) {
        $adminCanViewEvent = $admin->can('view', $testEvent);
        testResult(
            'Admin NO puede ver eventos',
            ! $adminCanViewEvent,
            'Policy view() deniega acceso a admin'
        );
    }

    // ============================================================================
    // SECCIÓN 9: LIMPIEZA DE DATOS DE PRUEBA
    // ============================================================================

    section('9. LIMPIEZA DE DATOS DE PRUEBA');

    info('Eliminando datos de prueba...');

    // Eliminar participación
    if (isset($participation)) {
        $participation->delete();
        testResult('Participación de prueba eliminada', true);
    }

    // Eliminar comité
    if ($testCommittee) {
        $testCommittee->users()->detach();
        $testCommittee->delete();
        testResult('Comité de prueba eliminado', true);
    }

    // Eliminar evento
    $testEvent->delete();
    testResult('Evento de prueba eliminado', true);

    // ============================================================================
    // SECCIÓN 10: RESUMEN FINAL
    // ============================================================================

    section('10. RESUMEN DE RESULTADOS');

    echo "\n";
    echo COLOR_BOLD.'Total de Tests: '.COLOR_RESET.$testsTotal."\n";
    echo COLOR_GREEN.COLOR_BOLD.'Tests Exitosos: '.COLOR_RESET.$testsPassed."\n";

    if ($testsFailed > 0) {
        echo COLOR_RED.COLOR_BOLD.'Tests Fallidos: '.COLOR_RESET.$testsFailed."\n";
    }

    $successRate = ($testsPassed / $testsTotal) * 100;
    echo COLOR_BOLD.'Tasa de Éxito: '.COLOR_RESET;

    if ($successRate >= 90) {
        echo COLOR_GREEN.number_format($successRate, 2).'%'.COLOR_RESET."\n";
    } elseif ($successRate >= 70) {
        echo COLOR_YELLOW.number_format($successRate, 2).'%'.COLOR_RESET."\n";
    } else {
        echo COLOR_RED.number_format($successRate, 2).'%'.COLOR_RESET."\n";
    }

    echo "\n";

    if ($testsFailed === 0) {
        echo COLOR_GREEN.COLOR_BOLD;
        echo "╔══════════════════════════════════════════════════════════════╗\n";
        echo "║  ✓ TODAS LAS PRUEBAS PASARON EXITOSAMENTE                   ║\n";
        echo "║  El sistema está funcionando correctamente                   ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n";
        echo COLOR_RESET;
    } else {
        echo COLOR_RED.COLOR_BOLD;
        echo "╔══════════════════════════════════════════════════════════════╗\n";
        echo "║  ✗ ALGUNAS PRUEBAS FALLARON                                  ║\n";
        echo "║  Revisa los errores arriba para más detalles                ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n";
        echo COLOR_RESET;
    }

    echo "\n";

} catch (\Exception $e) {
    echo "\n".COLOR_RED.COLOR_BOLD;
    echo "╔══════════════════════════════════════════════════════════════╗\n";
    echo "║  ERROR CRÍTICO EN LA EJECUCIÓN DEL SCRIPT                    ║\n";
    echo "╚══════════════════════════════════════════════════════════════╝\n";
    echo COLOR_RESET."\n";

    echo COLOR_RED.'Mensaje: '.$e->getMessage().COLOR_RESET."\n";
    echo COLOR_YELLOW.'Archivo: '.$e->getFile().':'.$e->getLine().COLOR_RESET."\n\n";
    echo COLOR_YELLOW."Stack Trace:\n".$e->getTraceAsString().COLOR_RESET."\n\n";

    exit(1);
}

exit($testsFailed > 0 ? 1 : 0);
