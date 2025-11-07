import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { Task, CreateTaskData } from '@/services/taskService';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon, 
  FilterIcon, 
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PauseIcon
} from 'lucide-react';

interface TaskListProps {
  committeeId?: number;
  assignedToId?: number;
  showFilters?: boolean;
  showCreateButton?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  committeeId,
  assignedToId,
  showFilters = true,
  showCreateButton = true
}) => {
  const [filters, setFilters] = useState({
    status: '',
    riskLevel: ''
  });

  const { 
    tasks, 
    loading, 
    error, 
    fetchTasks, 
    createTask, 
    deleteTask, 
    completeTask
  } = useTasks({
    committeeId,
    assignedToId,
    status: filters.status || undefined,
    riskLevel: filters.riskLevel || undefined
  });

  const handleCreateTask = async (data: CreateTaskData) => {
    try {
      await createTask(data);
      // Aquí podrías abrir un modal de creación
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (task: Task) => {
    try {
      // Aquí podrías abrir un modal de edición
      console.log('Update task:', task);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleAssignTask = async (task: Task) => {
    try {
      // Aquí podrías abrir un modal de asignación
      console.log('Assign task:', task);
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    if (window.confirm('¿Estás seguro de que quieres marcar esta tarea como completada?')) {
      try {
        await completeTask(task.id);
      } catch (error) {
        console.error('Error completing task:', error);
      }
    }
  };

  const handleReportProgress = async (task: Task) => {
    try {
      // Aquí podrías abrir un modal de reporte de progreso
      console.log('Report progress for task:', task);
    } catch (error) {
      console.error('Error reporting progress:', error);
    }
  };

  const getStatusStats = () => {
    // Asegurar que tasks es un array
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    
    const stats = {
      total: tasksArray.length,
      completed: tasksArray.filter(t => t.status === 'Completed').length,
      inProgress: tasksArray.filter(t => t.status === 'InProgress').length,
      delayed: tasksArray.filter(t => t.status === 'Delayed').length,
      paused: tasksArray.filter(t => t.status === 'Paused').length,
    };
    return stats;
  };

  // const getRiskStats = () => {
  //   const stats = {
  //     low: tasks.filter(t => t.risk_level === 'Low').length,
  //     medium: tasks.filter(t => t.risk_level === 'Medium').length,
  //     high: tasks.filter(t => t.risk_level === 'High').length,
  //   };
  //   return stats;
  // };

  const statusStats = getStatusStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCwIcon className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando tareas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchTasks} variant="outline">
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tareas</h2>
          <p className="text-gray-600">
            {statusStats.total} tarea(s) en total
          </p>
        </div>
        {showCreateButton && (
          <Button onClick={() => handleCreateTask({} as CreateTaskData)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Tarea
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium">Completadas</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{statusStats.completed}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-blue-600" />
            <span className="font-medium">En Progreso</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{statusStats.inProgress}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="font-medium">Retrasadas</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{statusStats.delayed}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <PauseIcon className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">Pausadas</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{statusStats.paused}</p>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <FilterIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Filtros:</span>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="InProgress">En Progreso</option>
              <option value="Completed">Completadas</option>
              <option value="Delayed">Retrasadas</option>
              <option value="Paused">Pausadas</option>
            </select>
            
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value }))}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="">Todos los niveles de riesgo</option>
              <option value="Low">Riesgo Bajo</option>
              <option value="Medium">Riesgo Medio</option>
              <option value="High">Riesgo Alto</option>
            </select>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilters({ status: '', riskLevel: '' })}
            >
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      {(!Array.isArray(tasks) || tasks.length === 0) ? (
        <div className="text-center py-8">
          <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay tareas disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
            />
          ))}
        </div>
      )}
    </div>
  );
};
