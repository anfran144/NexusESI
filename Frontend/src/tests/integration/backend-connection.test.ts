/**
 * Test de Integración: Conexión Frontend-Backend
 * 
 * Este archivo contiene pruebas para verificar que el frontend
 * se conecta correctamente con el backend.
 */

import { api } from '@/services/api';
import { taskService } from '@/services/taskService';

// Configuración de prueba
const TEST_CONFIG = {
  backendUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 5000,
};

/**
 * Test 1: Verificar que el backend está accesible
 */
export async function testBackendConnection(): Promise<boolean> {
  try {
    console.log('🔍 Verificando conexión con el backend...');
    const response = await api.get('/health', { timeout: TEST_CONFIG.timeout });
    console.log('✅ Backend accesible:', response.status === 200);
    return response.status === 200;
  } catch (error) {
    console.error('❌ Error de conexión con el backend:', error);
    return false;
  }
}

/**
 * Test 2: Verificar autenticación JWT
 */
export async function testJWTAuthentication(email: string, password: string): Promise<boolean> {
  try {
    console.log('🔍 Verificando autenticación JWT...');
    const response = await api.post('/auth/login', { email, password });
    const hasToken = !!response.data.access_token;
    console.log('✅ Token JWT recibido:', hasToken);
    return hasToken;
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    return false;
  }
}

/**
 * Test 3: Verificar endpoints de tareas
 */
export async function testTasksEndpoints(): Promise<boolean> {
  try {
    console.log('🔍 Verificando endpoints de tareas...');
    const tasks = await taskService.getTasks();
    console.log('✅ Tareas obtenidas:', tasks.length);
    return Array.isArray(tasks);
  } catch (error) {
    console.error('❌ Error al obtener tareas:', error);
    return false;
  }
}

/**
 * Test 4: Verificar endpoints de alertas
 */
export async function testAlertsEndpoints(): Promise<boolean> {
  try {
    console.log('🔍 Verificando endpoints de alertas...');
    const alerts = await taskService.getAlerts();
    console.log('✅ Alertas obtenidas:', alerts.length);
    return Array.isArray(alerts);
  } catch (error) {
    console.error('❌ Error al obtener alertas:', error);
    return false;
  }
}

/**
 * Test 5: Verificar endpoints de incidentes
 */
export async function testIncidentsEndpoints(): Promise<boolean> {
  try {
    console.log('🔍 Verificando endpoints de incidentes...');
    const incidents = await taskService.getIncidents();
    console.log('✅ Incidentes obtenidos:', incidents.length);
    return Array.isArray(incidents);
  } catch (error) {
    console.error('❌ Error al obtener incidentes:', error);
    return false;
  }
}

/**
 * Test 6: Verificar estadísticas de alertas
 */
export async function testAlertStatistics(): Promise<boolean> {
  try {
    console.log('🔍 Verificando estadísticas de alertas...');
    const stats = await taskService.getAlertStatistics();
    console.log('✅ Estadísticas obtenidas:', stats);
    return !!stats;
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return false;
  }
}

/**
 * Ejecutar todas las pruebas de integración
 */
export async function runIntegrationTests(credentials?: { email: string; password: string }): Promise<void> {
  console.log('🚀 Iniciando pruebas de integración Frontend-Backend...\n');

  const results = {
    backendConnection: await testBackendConnection(),
    jwtAuth: credentials ? await testJWTAuthentication(credentials.email, credentials.password) : false,
    tasksEndpoints: await testTasksEndpoints(),
    alertsEndpoints: await testAlertsEndpoints(),
    incidentsEndpoints: await testIncidentsEndpoints(),
    alertStatistics: await testAlertStatistics(),
  };

  console.log('\n📊 RESULTADOS DE PRUEBAS DE INTEGRACIÓN:');
  console.log('=========================================');
  console.log(`Backend Connection: ${results.backendConnection ? '✅' : '❌'}`);
  console.log(`JWT Authentication: ${results.jwtAuth ? '✅' : '❌'}`);
  console.log(`Tasks Endpoints: ${results.tasksEndpoints ? '✅' : '❌'}`);
  console.log(`Alerts Endpoints: ${results.alertsEndpoints ? '✅' : '❌'}`);
  console.log(`Incidents Endpoints: ${results.incidentsEndpoints ? '✅' : '❌'}`);
  console.log(`Alert Statistics: ${results.alertStatistics ? '✅' : '❌'}`);
  console.log('=========================================');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const percentage = ((passedTests / totalTests) * 100).toFixed(2);

  console.log(`\n✨ RESULTADO FINAL: ${passedTests}/${totalTests} pruebas pasadas (${percentage}%)`);
}

// Exportar función para uso en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).runIntegrationTests = runIntegrationTests;
  console.log('💡 Tip: Ejecuta window.runIntegrationTests() en la consola para probar la integración');
}

