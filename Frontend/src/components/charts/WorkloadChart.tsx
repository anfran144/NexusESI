import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

export interface WorkloadData {
  user_id: number
  user_name: string
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
}

interface WorkloadChartProps {
  data: WorkloadData[]
}

const COLORS = {
  completed: '#22c55e',
  pending: '#f59e0b',
  overdue: '#ef4444',
}

export function WorkloadChart({ data }: WorkloadChartProps) {
  // Preparar datos para el gráfico apilado
  const chartData = data.map(item => ({
    name: item.user_name,
    completadas: item.completed_tasks,
    pendientes: item.pending_tasks,
    vencidas: item.overdue_tasks,
    total: item.total_tasks,
  }))

  // Calcular el máximo para el dominio del Y
  const maxTasks = Math.max(...chartData.map(d => d.total), 1)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 11 }}
        />
        <YAxis 
          domain={[0, maxTasks]}
          label={{ value: 'Cantidad de Tareas', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              completadas: 'Completadas',
              pendientes: 'Pendientes',
              vencidas: 'Vencidas',
            }
            return [value, labels[name] || name]
          }}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend 
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              completadas: 'Completadas',
              pendientes: 'Pendientes',
              vencidas: 'Vencidas',
            }
            return labels[value] || value
          }}
        />
        <Bar dataKey="completadas" stackId="a" fill={COLORS.completed} name="completadas" />
        <Bar dataKey="pendientes" stackId="a" fill={COLORS.pending} name="pendientes" />
        <Bar dataKey="vencidas" stackId="a" fill={COLORS.overdue} name="vencidas" />
      </BarChart>
    </ResponsiveContainer>
  )
}
