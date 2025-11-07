import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export interface ProgressHistoryData {
  date: string
  completed_tasks: number
  total_tasks: number
  progress_percentage: number
}

interface ProgressTimelineChartProps {
  data: ProgressHistoryData[]
  days?: number
}

export function ProgressTimelineChart({ data, days = 30 }: ProgressTimelineChartProps) {
  // Formatear fechas para mostrar en el gráfico
  const chartData = data.map(item => ({
    ...item,
    dateFormatted: format(parseISO(item.date), 'dd/MM', { locale: es }),
    dateFull: format(parseISO(item.date), 'dd MMM yyyy', { locale: es }),
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="dateFormatted" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          domain={[0, 100]}
          label={{ value: 'Progreso (%)', angle: -90, position: 'insideLeft' }}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number, name: string, props: any) => [
            // Mantener 1 decimal en historial para mayor precisión en tendencias
            `${value.toFixed(1)}%`,
            'Progreso'
          ]}
          labelFormatter={(label) => {
            const item = chartData.find(d => d.dateFormatted === label)
            return item ? item.dateFull : label
          }}
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="progress_percentage" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Progreso (%)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
