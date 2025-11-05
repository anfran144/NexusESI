import { useState, useEffect, useCallback } from 'react';
import { taskService, Incident, IncidentData } from '../services/taskService';
import { useAuthStore } from '@/stores/auth-store';

interface UseIncidentsParams {
  taskId?: number;
  reportedById?: number;
  status?: string;
}

export const useIncidents = (params?: UseIncidentsParams) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener el usuario del store de Zustand
  const { user } = useAuthStore();

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getIncidents(params);
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las incidencias');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (user) {
      fetchIncidents();
    }
  }, [fetchIncidents, user]);

  const createIncident = useCallback(async (data: IncidentData): Promise<Incident> => {
    try {
      const newIncident = await taskService.createIncident(data);
      setIncidents(prev => [...prev, newIncident]);
      return newIncident;
    } catch (err) {
      throw err;
    }
  }, []);

  const resolveIncident = useCallback(async (id: number, solutionTaskId?: number): Promise<Incident> => {
    try {
      const resolvedIncident = await taskService.resolveIncident(id, solutionTaskId);
      setIncidents(prev => prev.map(incident => 
        incident.id === id ? resolvedIncident : incident
      ));
      return resolvedIncident;
    } catch (err) {
      throw err;
    }
  }, []);

  const reportedCount = incidents.filter(incident => incident.status === 'Reported').length;
  const resolvedCount = incidents.filter(incident => incident.status === 'Resolved').length;

  return {
    incidents,
    loading,
    error,
    reportedCount,
    resolvedCount,
    fetchIncidents,
    createIncident,
    resolveIncident,
  };
};

export const useIncident = (id: number) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncident = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getIncident(id);
      setIncident(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la incidencia');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const resolveIncident = useCallback(async (solutionTaskId?: number): Promise<Incident> => {
    try {
      const resolvedIncident = await taskService.resolveIncident(id, solutionTaskId);
      setIncident(resolvedIncident);
      return resolvedIncident;
    } catch (err) {
      throw err;
    }
  }, [id]);

  return {
    incident,
    loading,
    error,
    fetchIncident,
    resolveIncident,
  };
};
