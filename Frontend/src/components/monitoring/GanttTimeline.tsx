import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Task {
  id: number;
  title: string;
  status: string;
  committee_id: number;
  due_date: string;
  created_at: string;
}

interface Committee {
  id: number;
  name: string;
  color: string;
}

interface GanttTimelineProps {
  tasks: Task[];
  committees: Committee[];
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({ tasks, committees }) => {
  // Calcular fechas mínimas y máximas
  const { minDate, maxDate, totalDays, todayPosition } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 días después
        totalDays: 30,
        todayPosition: '0%'
      };
    }

    const dates = tasks.map(task => new Date(task.due_date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Agregar margen de 7 días antes y después
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);
    
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Calcular posición de "Hoy"
    const today = new Date();
    const todayPosition = today >= minDate && today <= maxDate 
      ? `${((today.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000) * 100) / totalDays}%`
      : '0%';

    return { minDate, maxDate, totalDays, todayPosition };
  }, [tasks]);

  // Función para obtener el comité de una tarea
  const getCommittee = (committeeId: number) => {
    return committees.find(c => c.id === committeeId);
  };

  // Función para calcular la posición y ancho de una tarea
  const getTaskPosition = (task: Task) => {
    const taskDate = new Date(task.due_date);
    const daysFromStart = (taskDate.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000);
    const position = (daysFromStart / totalDays) * 100;
    
    // Ancho mínimo de 2% para tareas muy cortas
    const width = Math.max(2, 100 / totalDays * 3); // 3 días de ancho por defecto
    
    return {
      left: `${position}%`,
      width: `${width}%`
    };
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold">Cronograma de Tareas</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Completada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>En progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-400" />
            <span>Asignada</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Timeline header */}
        <div className="flex items-center mb-4 pl-48">
          <div className="flex-1 relative h-8 border-b border-border/50">
            {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, i) => {
              const weekDate = new Date(minDate);
              weekDate.setDate(weekDate.getDate() + i * 7);
              return (
                <div
                  key={i}
                  className="absolute text-xs text-muted-foreground"
                  style={{ left: `${(i * 7 * 100) / totalDays}%` }}
                >
                  {weekDate.toLocaleDateString("es-ES", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          {tasks.map((task) => {
            const committee = getCommittee(task.committee_id);
            const position = getTaskPosition(task);
            const statusColor =
              task.status === "Completed" 
                ? "bg-green-500" 
                : task.status === "InProgress" 
                ? "bg-blue-500" 
                : "bg-gray-400";

            return (
              <div key={task.id} className="flex items-center group">
                <div className="w-48 pr-4 text-sm truncate">
                  {task.title}
                  <span className="text-xs text-muted-foreground block">{committee?.name}</span>
                </div>
                <div className="flex-1 relative h-10">
                  <div
                    className={cn(
                      "absolute h-6 rounded-sm top-2 transition-all group-hover:h-8 group-hover:top-1",
                      statusColor,
                    )}
                    style={position}
                  >
                    <div className="px-2 py-1 text-xs text-white truncate">{task.title}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 pointer-events-none"
          style={{ left: `calc(12rem + ${todayPosition})` }}
        >
          <div className="absolute -top-2 -left-8 text-xs text-red-500 font-medium">Hoy</div>
        </div>
      </div>
    </div>
  );
};