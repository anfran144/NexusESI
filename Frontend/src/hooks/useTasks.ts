import { useState, useEffect, useCallback } from 'react';
import { taskService, Task, CreateTaskData, UpdateTaskData, TaskProgressData } from '../services/taskService';
import { useAuthStore } from '@/stores/auth-store';

interface UseTasksParams {
  committeeId?: number;
  assignedToId?: number;
  status?: string;
  riskLevel?: string;
}

export const useTasks = (params?: UseTasksParams) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener el usuario del store de Zustand
  const { user } = useAuthStore();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTasks(params);
      // Asegurar que data es un array
      const tasksArray = Array.isArray(data) ? data : ((data as any)?.data || []);
      setTasks(tasksArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las tareas');
      setTasks([]); // Asegurar que tasks siempre sea un array
    } finally {
      setLoading(false);
    }
  }, [params?.committeeId, params?.assignedToId, params?.status, params?.riskLevel]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [fetchTasks, user]);

  const createTask = useCallback(async (data: CreateTaskData): Promise<Task> => {
    try {
      const newTask = await taskService.createTask(data);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: number, data: UpdateTaskData): Promise<Task> => {
    try {
      const updatedTask = await taskService.updateTask(id, data);
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      return updatedTask;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: number): Promise<void> => {
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  const assignTask = useCallback(async (taskId: number, userId: number): Promise<Task> => {
    try {
      const updatedTask = await taskService.assignTask(taskId, userId);
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      return updatedTask;
    } catch (err) {
      throw err;
    }
  }, []);

  const completeTask = useCallback(async (taskId: number): Promise<Task> => {
    try {
      const updatedTask = await taskService.completeTask(taskId);
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
      return updatedTask;
    } catch (err) {
      throw err;
    }
  }, []);

  const reportProgress = useCallback(async (taskId: number, data: TaskProgressData): Promise<void> => {
    try {
      await taskService.reportProgress(taskId, data);
      // Refrescar la tarea para obtener el progreso actualizado
      const updatedTask = await taskService.getTask(taskId);
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    completeTask,
    reportProgress,
  };
};

export const useTask = (id: number) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTask(id);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la tarea');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const updateTask = useCallback(async (data: UpdateTaskData): Promise<Task> => {
    try {
      const updatedTask = await taskService.updateTask(id, data);
      setTask(updatedTask);
      return updatedTask;
    } catch (err) {
      throw err;
    }
  }, [id]);

  const assignTask = useCallback(async (userId: number): Promise<Task> => {
    try {
      const updatedTask = await taskService.assignTask(id, userId);
      setTask(updatedTask);
      return updatedTask;
    } catch (err) {
      throw err;
    }
  }, [id]);

  const completeTask = useCallback(async (): Promise<Task> => {
    try {
      const updatedTask = await taskService.completeTask(id);
      setTask(updatedTask);
      return updatedTask;
    } catch (err) {
      throw err;
    }
  }, [id]);

  const reportProgress = useCallback(async (data: TaskProgressData): Promise<void> => {
    try {
      await taskService.reportProgress(id, data);
      // Refrescar la tarea para obtener el progreso actualizado
      const updatedTask = await taskService.getTask(id);
      setTask(updatedTask);
    } catch (err) {
      throw err;
    }
  }, [id]);

  return {
    task,
    loading,
    error,
    fetchTask,
    updateTask,
    assignTask,
    completeTask,
    reportProgress,
  };
};
