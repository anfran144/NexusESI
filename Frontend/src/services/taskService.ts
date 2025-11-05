import { api } from './api';

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Delayed' | 'Paused';
  risk_level: 'Low' | 'Medium' | 'High';
  assigned_to_id?: number;
  committee_id?: number;
  event_id: number;
  assigned_to?: {
    id: number;
    name: string;
    email: string;
  };
  committee?: {
    id: number;
    name: string;
    event: {
      id: number;
      name: string;
    };
  };
  event?: {
    id: number;
    name: string;
  };
  progress?: TaskProgress[];
  incidents?: Incident[];
  alerts?: Alert[];
  created_at: string;
  updated_at: string;
}

export interface TaskProgress {
  id: number;
  description: string;
  file_name?: string;
  file_path?: string;
  task_id: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface Incident {
  id: number;
  description: string;
  status: 'Reported' | 'Resolved';
  task_id: number;
  reported_by_id: number;
  file_name?: string;
  file_path?: string;
  solution_task_id?: number;
  reported_by?: {
    id: number;
    name: string;
  };
  solution_task?: Task;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  message: string;
  type: 'Preventive' | 'Critical';
  task_id?: number;
  user_id: number;
  is_read: boolean;
  read_at?: string;
  task?: Task;
  user?: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'alert' | 'progress' | 'incident' | 'task_update' | 'info';
  is_read: boolean;
  user_id: number;
  task_id?: number;
  progress_id?: number;
  incident_id?: number;
  alert_id?: number;
  metadata?: Record<string, any>;
  task?: Task;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  due_date: string;
  event_id?: number;
  committee_id?: number;
  assigned_to_id?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string;
  status?: 'Pending' | 'InProgress' | 'Completed' | 'Delayed' | 'Paused';
  assigned_to_id?: number;
  committee_id?: number;
}

export interface TaskProgressData {
  description: string;
  file?: File;
}

export interface IncidentData {
  task_id: number;
  description: string;
  file?: File;
}

export interface AlertStatistics {
  total_alerts: number;
  unread_alerts: number;
  critical_alerts: number;
  preventive_alerts: number;
  alerts_by_type: {
    Preventive: number;
    Critical: number;
  };
  recent_alerts: Alert[];
}

class TaskService {
  private baseUrl = '/tasks';

  // CRUD básico de tareas
  async getTasks(params?: {
    event_id?: number;
    committee_id?: number;
    committee_ids?: number[];
    assigned_to_id?: number | null;
    status?: string;
    statuses?: string[];
    exclude_statuses?: string[];
    risk_level?: string;
    due_date_from?: string;
    due_date_to?: string;
    date_range?: string;
  }): Promise<Task[]> {
    const queryParams = new URLSearchParams();
    if (params?.event_id) queryParams.append('event_id', params.event_id.toString());
    
    // Soporte para múltiples comités
    if (params?.committee_ids && params.committee_ids.length > 0) {
      queryParams.append('committee_ids', params.committee_ids.join(','));
    } else if (params?.committee_id) {
      queryParams.append('committee_id', params.committee_id.toString());
    }
    
    if (params?.assigned_to_id !== undefined) {
      if (params.assigned_to_id === null) {
        queryParams.append('assigned_to_id', 'null');
      } else {
        queryParams.append('assigned_to_id', params.assigned_to_id.toString());
      }
    }
    
    // Soporte para múltiples estados
    if (params?.statuses && params.statuses.length > 0) {
      queryParams.append('statuses', params.statuses.join(','));
    } else if (params?.status) {
      queryParams.append('status', params.status);
    }
    
    // Excluir estados
    if (params?.exclude_statuses && params.exclude_statuses.length > 0) {
      queryParams.append('exclude_statuses', params.exclude_statuses.join(','));
    }
    
    if (params?.risk_level) queryParams.append('risk_level', params.risk_level);
    
    // Filtros por fecha
    if (params?.due_date_from) queryParams.append('due_date_from', params.due_date_from);
    if (params?.due_date_to) queryParams.append('due_date_to', params.due_date_to);
    if (params?.date_range) queryParams.append('date_range', params.date_range);

    const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
    const response = await api.get(url);
    // Extraer el array de tareas de la respuesta del backend
    return response.data.data || response.data || [];
  }

  async getTask(id: number): Promise<Task> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data.data || response.data;
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post(this.baseUrl, data);
    return response.data.data || response.data;
  }

  async updateTask(id: number, data: UpdateTaskData): Promise<Task> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteTask(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  // Funcionalidades específicas de tareas
  async assignTask(taskId: number, userId: number): Promise<Task> {
    const response = await api.post(`${this.baseUrl}/${taskId}/assign`, {
      assigned_to_id: userId
    });
    return response.data.data || response.data;
  }

  async completeTask(taskId: number): Promise<Task> {
    const response = await api.put(`${this.baseUrl}/${taskId}/complete`);
    return response.data.data || response.data;
  }

  async reportProgress(taskId: number, data: TaskProgressData): Promise<TaskProgress> {
    const formData = new FormData();
    formData.append('description', data.description);
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await api.post(`${this.baseUrl}/${taskId}/progress`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data || response.data;
  }

  // Gestión de incidencias
  async getIncidents(params?: {
    task_id?: number;
    task_ids?: number[];
    reported_by_id?: number;
    status?: string;
    statuses?: string[];
    exclude_statuses?: string[];
    committee_ids?: number[];
    created_from?: string;
    created_to?: string;
    date_range?: string;
  }): Promise<Incident[]> {
    const queryParams = new URLSearchParams();
    
    // Soporte para múltiples tareas
    if (params?.task_ids && params.task_ids.length > 0) {
      queryParams.append('task_ids', params.task_ids.join(','));
    } else if (params?.task_id) {
      queryParams.append('task_id', params.task_id.toString());
    }
    
    if (params?.reported_by_id) queryParams.append('reported_by_id', params.reported_by_id.toString());
    
    // Soporte para múltiples estados
    if (params?.statuses && params.statuses.length > 0) {
      queryParams.append('statuses', params.statuses.join(','));
    } else if (params?.status) {
      queryParams.append('status', params.status);
    }
    
    // Excluir estados
    if (params?.exclude_statuses && params.exclude_statuses.length > 0) {
      queryParams.append('exclude_statuses', params.exclude_statuses.join(','));
    }
    
    // Filtros por comité
    if (params?.committee_ids && params.committee_ids.length > 0) {
      queryParams.append('committee_ids', params.committee_ids.join(','));
    }
    
    // Filtros por fecha
    if (params?.created_from) queryParams.append('created_from', params.created_from);
    if (params?.created_to) queryParams.append('created_to', params.created_to);
    if (params?.date_range) queryParams.append('date_range', params.date_range);

    const url = queryParams.toString() ? `/incidents?${queryParams}` : '/incidents';
    const response = await api.get(url);
    // Extraer el array de incidencias de la respuesta del backend
    return response.data.data || response.data || [];
  }

  async getIncident(id: number): Promise<Incident> {
    const response = await api.get(`/incidents/${id}`);
    return response.data.data || response.data;
  }

  async createIncident(data: IncidentData): Promise<Incident> {
    const formData = new FormData();
    formData.append('task_id', data.task_id.toString());
    formData.append('description', data.description);
    if (data.file) {
      formData.append('file', data.file);
    }

    const response = await api.post('/incidents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data || response.data;
  }

  async resolveIncident(id: number, solutionTaskId?: number): Promise<Incident> {
    const response = await api.put(`/incidents/${id}/resolve`, {
      solution_task_id: solutionTaskId
    });
    return response.data.data || response.data;
  }

  // Gestión de alertas
  async getAlerts(params?: {
    task_id?: number;
    user_id?: number;
    type?: string;
    is_read?: boolean;
  }): Promise<Alert[]> {
    const queryParams = new URLSearchParams();
    if (params?.task_id) queryParams.append('task_id', params.task_id.toString());
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_read !== undefined) queryParams.append('is_read', params.is_read.toString());

    const url = queryParams.toString() ? `/alerts?${queryParams}` : '/alerts';
    const response = await api.get(url);
    // Extraer el array de alertas de la respuesta del backend
    return response.data.data || response.data || [];
  }

  async getAlert(id: number): Promise<Alert> {
    const response = await api.get(`/alerts/${id}`);
    return response.data.data || response.data;
  }

  async markAlertAsRead(id: number): Promise<Alert> {
    const response = await api.put(`/alerts/${id}/read`);
    return response.data.data || response.data;
  }

  async markAllAlertsAsRead(): Promise<void> {
    await api.put('/alerts/read-all');
  }

  async getAlertStatistics(): Promise<AlertStatistics> {
    const response = await api.get('/alerts/statistics/overview');
    return response.data.data || response.data;
  }

  // Métodos de notificaciones
  async getNotifications(params?: {
    type?: string;
    is_read?: boolean;
  }): Promise<Notification[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_read !== undefined) queryParams.append('is_read', params.is_read.toString());

    const url = queryParams.toString() ? `/notifications?${queryParams}` : '/notifications';
    const response = await api.get(url);
    return response.data.data || response.data || [];
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data.data || response.data;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  }

  // Utilidades
  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return 'text-gray-600 bg-gray-100';
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'InProgress': return 'text-blue-600 bg-blue-100';
      case 'Delayed': return 'text-red-600 bg-red-100';
      case 'Paused': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getAlertTypeColor(type: string): string {
    switch (type) {
      case 'Preventive': return 'text-blue-600 bg-blue-100';
      case 'Critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isTaskOverdue(task: Task): boolean {
    return new Date(task.due_date) < new Date() && task.status !== 'Completed';
  }

  getDaysUntilDue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const taskService = new TaskService();
