import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  TrendingUp,
  UserCheck,
  Activity,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { adminService, type DashboardStats } from '@/services/admin-service'

interface StatCardProps {
  title: string
  value: number | string
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; label: string }
  loading?: boolean
}

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  loading = false
}: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <div className="flex items-center pt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+{trend.value} {trend.label}</span>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
)

export function DashboardStats() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await adminService.getDashboard()
        
        if (response.success && response.data) {
          setStats(response.data)
        } else {
          setError(response.message || 'Error al cargar las estadísticas')
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error)
        setError('Error de conexión al cargar las estadísticas')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Mensaje de bienvenida
  const WelcomeMessage = () => (
    <div className="flex flex-col space-y-2 mb-6">
      <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
      <p className="text-muted-foreground">
        Bienvenido, <span className="font-medium">{user?.name}</span>. 
        Gestiona instituciones, usuarios y supervisa el sistema NexusESI.
      </p>
    </div>
  )

  // Estado de error
  if (error) {
    return (
      <div className="space-y-6">
        <WelcomeMessage />
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WelcomeMessage />

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Instituciones"
          value={stats?.instituciones.total ?? 0}
          description="Instituciones registradas"
          icon={Building2}
          loading={loading}
          trend={stats?.estadisticas_recientes ? {
            value: stats.estadisticas_recientes.instituciones_mes,
            label: "este mes"
          } : undefined}
        />
        <StatCard
          title="Instituciones Activas"
          value={stats?.instituciones.activas ?? 0}
          description="Instituciones verificadas"
          icon={Building2}
          loading={loading}
        />
        <StatCard
          title="Coordinadores"
          value={stats?.usuarios.coordinadores ?? 0}
          description="Coordinadores activos"
          icon={UserCheck}
          loading={loading}
        />
        <StatCard
          title="Líderes de Semillero"
          value={stats?.usuarios.lideres ?? 0}
          description="Líderes registrados"
          icon={Users}
          loading={loading}
          trend={stats?.estadisticas_recientes ? {
            value: stats.estadisticas_recientes.usuarios_mes,
            label: "usuarios este mes"
          } : undefined}
        />
      </div>

      {/* Estadísticas detalladas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Usuarios por rol */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuarios por Rol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                    <div className="h-6 w-8 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              stats?.usuarios.por_rol && Object.entries(stats.usuarios.por_rol).map(([rol, cantidad]) => (
                <div key={rol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {rol === 'admin' ? 'Administrador' : 
                       rol === 'coordinator' ? 'Coordinador' : 
                       rol === 'seedbed_leader' ? 'Líder de Semillero' : rol}
                    </Badge>
                  </div>
                  <span className="font-medium">{cantidad}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Estado de instituciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Estado de Instituciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                    <div className="h-6 w-8 bg-muted animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">
                      Activas
                    </Badge>
                  </div>
                  <span className="font-medium">{stats?.instituciones.activas ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Inactivas
                    </Badge>
                  </div>
                  <span className="font-medium">{stats?.instituciones.inactivas ?? 0}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen general */}
      {stats && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Resumen del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.usuarios.total}</div>
                <p className="text-sm text-muted-foreground">Total de Usuarios</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.instituciones.total}</div>
                <p className="text-sm text-muted-foreground">Total de Instituciones</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((stats.instituciones.activas / stats.instituciones.total) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">Instituciones Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}