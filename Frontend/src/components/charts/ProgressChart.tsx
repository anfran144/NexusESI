import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface ProgressChartProps {
  completed: number
  total: number
}

const COLORS = {
  completed: '#22c55e',
  pending: '#e5e7eb',
}

export function ProgressChart({ completed, total }: ProgressChartProps) {
  const pending = Math.max(0, total - completed)
  
  const data = [
    { name: 'Completadas', value: completed, color: COLORS.completed },
    { name: 'Pendientes', value: pending, color: COLORS.pending },
  ]

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-2xl font-bold">{percentage}%</p>
        <p className="text-sm text-muted-foreground">Progreso General</p>
      </div>
    </div>
  )
}
