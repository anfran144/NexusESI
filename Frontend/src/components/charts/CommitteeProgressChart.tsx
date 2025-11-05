import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface CommitteeData {
  committee_id: number
  committee_name: string
  progress_percentage: number
  completed_tasks: number
  total_tasks: number
}

interface CommitteeProgressChartProps {
  data: CommitteeData[]
}

export function CommitteeProgressChart({ data }: CommitteeProgressChartProps) {
  const chartData = data.map(item => ({
    ...item,
    name: item.committee_name,
    value: item.progress_percentage,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} label={{ value: 'Progreso (%)', position: 'insideBottom', offset: -5 }} />
        <YAxis 
          dataKey="committee_name" 
          type="category" 
          width={150} 
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value: number, _name: string, props: any) => [
            `${value.toFixed(1)}% (${props.payload.completed_tasks}/${props.payload.total_tasks} tareas)`,
            'Progreso'
          ]}
        />
        <Legend />
        <Bar 
          dataKey="progress_percentage" 
          fill="#3b82f6"
          radius={[0, 8, 8, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
