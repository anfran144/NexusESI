/**
 * Test End-to-End: Flujo Completo de Tareas
 * 
 * Este archivo contiene pruebas E2E para validar el flujo completo
 * de gestión de tareas desde la creación hasta la finalización.
 */

import { taskService, CreateTaskData, TaskProgressData } from '@/services/taskService';

/**
 * Test E2E: Flujo completo de una tarea
 * 1. Crear tarea
 * 2. Asignar tarea
 * 3. Reportar progreso
 * 4. Completar tarea
 */
export async function testCompleteTaskWorkflow(committeeId: number, userId: number): Promise<boolean> {
  try {
    console.log('🚀 Iniciando test E2E: Flujo completo de tarea...\n');

    // 1. Crear tarea
    console.log('📝 Paso 1: Creando tarea...');
    const taskData: CreateTaskData = {
      title: 'Tarea de Prueba E2E',
      description: 'Esta es una tarea creada para pruebas end-to-end',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días desde ahora
      committee_id: committeeId,
    };
    const createdTask = await taskService.createTask(taskData);
    console.log('✅ Tarea creada:', createdTask.id);

    // 2. Asignar tarea
    console.log('\n👤 Paso 2: Asignando tarea...');
    const assignedTask = await taskService.assignTask(createdTask.id, userId);
    console.log('✅ Tarea asignada a usuario:', assignedTask.assigned_to?.name);

    // 3. Reportar progreso
    console.log('\n📊 Paso 3: Reportando progreso...');
    const progressData: TaskProgressData = {
      description: 'Progreso inicial de la tarea',
    };
    await taskService.reportProgress(createdTask.id, progressData);
    console.log('✅ Progreso reportado');

    // 4. Completar tarea
    console.log('\n✔️ Paso 4: Completando tarea...');
    const completedTask = await taskService.completeTask(createdTask.id);
    console.log('✅ Tarea completada:', completedTask.status);

    // 5. Limpiar: Eliminar tarea de prueba
    console.log('\n🧹 Paso 5: Limpiando tarea de prueba...');
    await taskService.deleteTask(createdTask.id);
    console.log('✅ Tarea eliminada');

    console.log('\n🎉 Test E2E completado exitosamente!');
    return true;
  } catch (error) {
    console.error('❌ Error en test E2E:', error);
    return false;
  }
}

/**
 * Test E2E: Flujo de incidente
 * 1. Crear incidente
 * 2. Resolver incidente
 */
export async function testIncidentWorkflow(taskId: number): Promise<boolean> {
  try {
    console.log('🚀 Iniciando test E2E: Flujo de incidente...\n');

    // 1. Crear incidente
    console.log('📝 Paso 1: Reportando incidente...');
    const incidentData = {
      description: 'Incidente de prueba E2E',
      task_id: taskId,
    };
    const createdIncident = await taskService.createIncident(incidentData);
    console.log('✅ Incidente reportado:', createdIncident.id);

    // 2. Resolver incidente
    console.log('\n✔️ Paso 2: Resolviendo incidente...');
    const resolvedIncident = await taskService.resolveIncident(createdIncident.id);
    console.log('✅ Incidente resuelto:', resolvedIncident.status);

    console.log('\n🎉 Test E2E de incidente completado exitosamente!');
    return true;
  } catch (error) {
    console.error('❌ Error en test E2E de incidente:', error);
    return false;
  }
}

/**
 * Test E2E: Flujo de alertas
 * 1. Obtener alertas
 * 2. Marcar alerta como leída
 * 3. Marcar todas las alertas como leídas
 */
export async function testAlertWorkflow(): Promise<boolean> {
  try {
    console.log('🚀 Iniciando test E2E: Flujo de alertas...\n');

    // 1. Obtener alertas
    console.log('📝 Paso 1: Obteniendo alertas...');
    const alerts = await taskService.getAlerts();
    console.log('✅ Alertas obtenidas:', alerts.length);

    if (alerts.length > 0) {
      // 2. Marcar primera alerta como leída
      console.log('\n✔️ Paso 2: Marcando alerta como leída...');
      await taskService.markAlertAsRead(alerts[0].id);
      console.log('✅ Alerta marcada como leída');

      // 3. Marcar todas las alertas como leídas
      console.log('\n✔️ Paso 3: Marcando todas las alertas como leídas...');
      await taskService.markAllAlertsAsRead();
      console.log('✅ Todas las alertas marcadas como leídas');
    }

    console.log('\n🎉 Test E2E de alertas completado exitosamente!');
    return true;
  } catch (error) {
    console.error('❌ Error en test E2E de alertas:', error);
    return false;
  }
}

/**
 * Ejecutar todos los tests E2E
 */
export async function runE2ETests(config: { committeeId: number; userId: number; taskId?: number }): Promise<void> {
  console.log('🚀 Iniciando pruebas End-to-End...\n');

  const results = {
    taskWorkflow: await testCompleteTaskWorkflow(config.committeeId, config.userId),
    incidentWorkflow: config.taskId ? await testIncidentWorkflow(config.taskId) : false,
    alertWorkflow: await testAlertWorkflow(),
  };

  console.log('\n📊 RESULTADOS DE PRUEBAS E2E:');
  console.log('=========================================');
  console.log(`Task Workflow: ${results.taskWorkflow ? '✅' : '❌'}`);
  console.log(`Incident Workflow: ${results.incidentWorkflow ? '✅' : '❌'}`);
  console.log(`Alert Workflow: ${results.alertWorkflow ? '✅' : '❌'}`);
  console.log('=========================================');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const percentage = ((passedTests / totalTests) * 100).toFixed(2);

  console.log(`\n✨ RESULTADO FINAL: ${passedTests}/${totalTests} pruebas pasadas (${percentage}%)`);
}

// Exportar función para uso en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).runE2ETests = runE2ETests;
  console.log('💡 Tip: Ejecuta window.runE2ETests({committeeId: 1, userId: 1}) en la consola para probar E2E');
}

