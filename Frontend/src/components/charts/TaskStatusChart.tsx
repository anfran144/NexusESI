import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export interface TaskStatusData {
  completed: number
  in_progress: number
  pending: number
  delayed: number
  paused?: number
}

interface TaskStatusChartProps {
  data: TaskStatusData
}

const COLORS = {
  completed: '#22c55e',
  in_progress: '#3b82f6',
  pending: '#e5e7eb',
  delayed: '#ef4444',
  paused: '#f59e0b',
}

const LABELS = {
  completed: 'Completadas',
  in_progress: 'En Progreso',
  pending: 'Pendientes',
  delayed: 'Retrasadas',
  paused: 'Pausadas',
}

export function TaskStatusChart({ data }: TaskStatusChartProps) {
  const chartData = [
    { name: LABELS.completed, value: data.completed, color: COLORS.completed },
    { name: LABELS.in_progress, value: data.in_progress, color: COLORS.in_progress },
    { name: LABELS.pending, value: data.pending, color: COLORS.pending },
    { name: LABELS.delayed, value: data.delayed, color: COLORS.delayed },
    ...(data.paused ? [{ name: LABELS.paused, value: data.paused, color: COLORS.paused }] : []),
  ].filter(item => item.value > 0) // Solo mostrar estados con tareas

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value, percent }) => 
              `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
            }
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              `${value} tareas`,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-2xl font-bold">{total}</p>
        <p className="text-sm text-muted-foreground">Total de Tareas</p>
      </div>
    </div>
  )
}
