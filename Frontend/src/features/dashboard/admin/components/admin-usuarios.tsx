import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Filter, 
  Eye, 
  UserCog, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  Crown
} from 'lucide-react'
import { adminService, type Usuario, type PaginatedResponse } from '@/services/admin-service'
import { toast } from 'sonner'

export function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<PaginatedResponse<Usuario> | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    search: '',
    rol: 'todos',
    estado: 'todos'
  })
  const [paginaActual, setPaginaActual] = useState(1)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false)
  const [modalCambioRolAbierto, setModalCambioRolAbierto] = useState(false)
  const [alertToggleAbierto, setAlertToggleAbierto] = useState(false)
  const [nuevoRol, setNuevoRol] = useState<'admin' | 'coordinator' | 'seedbed_leader'>('coordinator')
  const [accionToggle, setAccionToggle] = useState<{ usuario: Usuario; activar: boolean } | null>(null)

  const cargarUsuarios = async (pagina = 1) => {
    try {
      setLoading(true)
      const params: any = {
        page: pagina,
        per_page: 10
      }
      
      // Agregar filtros solo si no están vacíos o no son 'todos'
      if (filtros.search && filtros.search.trim() !== '') {
        params.search = filtros.search.trim()
      }
      
      if (filtros.rol && filtros.rol !== 'todos') {
        params.rol = filtros.rol
      }
      
      if (filtros.estado && filtros.estado !== 'todos') {
        // Mapear los estados del frontend al backend
        const estadoMap: Record<string, string> = {
          'activo': 'active',
          'inactivo': 'suspended',
          'pendiente': 'pending_approval'
        }
        params.status = estadoMap[filtros.estado] || filtros.estado
      }

      const response = await adminService.getUsuarios(params)
      if (response.success && response.data) {
        setUsuarios(response.data)
        setPaginaActual(pagina)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      toast.error('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [filtros]) // Recargar cuando cambien los filtros

  const aplicarFiltros = () => {
    setPaginaActual(1)
    cargarUsuarios(1)
  }

  const limpiarFiltros = () => {
    setFiltros({ search: '', rol: 'todos', estado: 'todos' })
    setPaginaActual(1)
    cargarUsuarios(1)
  }

  const abrirModalPerfil = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario)
    setModalPerfilAbierto(true)
  }

  const abrirModalCambioRol = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario)
    setNuevoRol(usuario.rol as 'admin' | 'coordinator' | 'seedbed_leader')
    setModalCambioRolAbierto(true)
  }

  const confirmarCambioRol = async () => {
    if (!usuarioSeleccionado) return

    try {
      const response = await adminService.cambiarRolUsuario(usuarioSeleccionado.id, nuevoRol)
      if (response.success) {
        toast.success('Rol actualizado exitosamente')
        setModalCambioRolAbierto(false)
        cargarUsuarios(paginaActual)
      } else {
        toast.error(response.message || 'Error al cambiar el rol')
      }
    } catch (error) {
      console.error('Error al cambiar rol:', error)
      toast.error('Error al cambiar el rol del usuario')
    }
  }

  const abrirAlertToggle = (usuario: Usuario, activar: boolean) => {
    setAccionToggle({ usuario, activar })
    setAlertToggleAbierto(true)
  }

  const confirmarToggleUsuario = async () => {
    if (!accionToggle) return

    try {
      const response = await adminService.toggleUsuario(accionToggle.usuario.id, accionToggle.activar)
      if (response.success) {
        toast.success(
          accionToggle.activar 
            ? 'Usuario activado exitosamente' 
            : 'Usuario desactivado exitosamente'
        )
        setAlertToggleAbierto(false)
        setAccionToggle(null)
        cargarUsuarios(paginaActual)
      } else {
        toast.error(response.message || 'Error al cambiar el estado del usuario')
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error('Error al cambiar el estado del usuario')
    }
  }

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'admin':
        return <Badge className="bg-red-500"><Crown className="w-3 h-3 mr-1" />Administrador</Badge>
      case 'coordinator':
        return <Badge className="bg-blue-500"><Shield className="w-3 h-3 mr-1" />Coordinador</Badge>
      case 'seedbed_leader':
        return <Badge className="bg-green-500"><Users className="w-3 h-3 mr-1" />Líder de Semillero</Badge>
      default:
        return <Badge variant="outline">{rol}</Badge>
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>
      case 'Pendiente':
        return <Badge className="bg-yellow-500"><XCircle className="w-3 h-3 mr-1" />Pendiente</Badge>
      case 'Suspendido':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Suspendido</Badge>
      default:
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactivo</Badge>
    }
  }

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'No verificado'
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Supervisa y administra todos los usuarios del sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtro-search">Buscar</Label>
              <Input
                id="filtro-search"
                placeholder="Buscar por nombre o email..."
                value={filtros.search}
                onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="filtro-rol">Rol</Label>
              <Select value={filtros.rol} onValueChange={(value) => setFiltros(prev => ({ ...prev, rol: value }))}>
                <SelectTrigger id="filtro-rol">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="coordinator">Coordinador</SelectItem>
                  <SelectItem value="seedbed_leader">Líder de Semillero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="filtro-estado">Estado</Label>
              <Select value={filtros.estado} onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}>
                <SelectTrigger id="filtro-estado">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={limpiarFiltros}>
                <Filter className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Email Verificado</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios?.data.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.id}</TableCell>
                        <TableCell>{usuario.name}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {formatearFecha(usuario.email_verified_at)}
                          </div>
                        </TableCell>
                        <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                        <TableCell>{getEstadoBadge(usuario.estado)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalPerfil(usuario)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalCambioRol(usuario)}
                            >
                              <UserCog className="w-3 h-3" />
                            </Button>
                            <Button
                              variant={usuario.estado === 'Activo' ? 'destructive' : 'default'}
                              size="sm"
                              onClick={() => abrirAlertToggle(usuario, usuario.estado !== 'Activo')}
                              disabled={usuario.estado === 'Pendiente'}
                            >
                              {usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {usuarios && usuarios.last_page > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {usuarios.from} a {usuarios.to} de {usuarios.total} usuarios
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cargarUsuarios(paginaActual - 1)}
                      disabled={paginaActual <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Página {paginaActual} de {usuarios.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cargarUsuarios(paginaActual + 1)}
                      disabled={paginaActual >= usuarios.last_page}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para ver perfil */}
      <Dialog open={modalPerfilAbierto} onOpenChange={setModalPerfilAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Perfil de Usuario</DialogTitle>
            <DialogDescription>
              Información detallada del usuario seleccionado
            </DialogDescription>
          </DialogHeader>
          {usuarioSeleccionado && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>ID</Label>
                <div className="text-sm font-mono">{usuarioSeleccionado.id}</div>
              </div>
              <div className="grid gap-2">
                <Label>Nombre</Label>
                <div className="text-sm">{usuarioSeleccionado.name}</div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <div className="text-sm">{usuarioSeleccionado.email}</div>
              </div>
              <div className="grid gap-2">
                <Label>Email Verificado</Label>
                <div className="text-sm">{formatearFecha(usuarioSeleccionado.email_verified_at)}</div>
              </div>
              <div className="grid gap-2">
                <Label>Rol</Label>
                <div>{getRolBadge(usuarioSeleccionado.rol)}</div>
              </div>
              <div className="grid gap-2">
                <Label>Estado</Label>
                <div>{getEstadoBadge(usuarioSeleccionado.estado)}</div>
              </div>
              <div className="grid gap-2">
                <Label>Fecha de Registro</Label>
                <div className="text-sm">{formatearFecha(usuarioSeleccionado.created_at)}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPerfilAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para cambiar rol */}
      <Dialog open={modalCambioRolAbierto} onOpenChange={setModalCambioRolAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para {usuarioSeleccionado?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nuevo-rol">Nuevo Rol</Label>
              <Select 
                value={nuevoRol} 
                onValueChange={(value: 'admin' | 'coordinator' | 'seedbed_leader') => setNuevoRol(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="coordinator">Coordinador</SelectItem>
                  <SelectItem value="seedbed_leader">Líder de Semillero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCambioRolAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCambioRol}>
              Cambiar Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar activar/desactivar */}
      <AlertDialog open={alertToggleAbierto} onOpenChange={setAlertToggleAbierto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accionToggle?.activar ? 'Activar Usuario' : 'Desactivar Usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas {accionToggle?.activar ? 'activar' : 'desactivar'} al usuario{' '}
              <strong>{accionToggle?.usuario.name}</strong>?
              {!accionToggle?.activar && ' El usuario no podrá acceder al sistema.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAccionToggle(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmarToggleUsuario}>
              {accionToggle?.activar ? 'Activar' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}