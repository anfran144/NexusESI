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
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { adminService, type Institucion, type PaginatedResponse } from '@/services/admin-service'
import { toast } from 'sonner'

export function AdminInstituciones() {
  const [instituciones, setInstituciones] = useState<PaginatedResponse<Institucion> | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    nombre: '',
    identificador: '',
    estado: 'todos'
  })
  const [paginaActual, setPaginaActual] = useState(1)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [institucionEditando, setInstitucionEditando] = useState<Institucion | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    identificador: '',
    ciudad_id: '',
    estado: 'pendiente' as 'activo' | 'inactivo' | 'pendiente'
  })

  const cargarInstituciones = async (pagina = 1) => {
    try {
      setLoading(true)
      const params = {
        ...filtros,
        page: pagina,
        per_page: 10
      }
      
      // Limpiar filtros vacíos
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '' || params[key as keyof typeof params] === 'todos') {
          delete params[key as keyof typeof params]
        }
      })

      const response = await adminService.getInstituciones(params)
      if (response.success && response.data) {
        setInstituciones(response.data)
        setPaginaActual(pagina)
      }
    } catch (error) {
      console.error('Error al cargar instituciones:', error)
      toast.error('Error al cargar las instituciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarInstituciones()
  }, [])

  const aplicarFiltros = () => {
    setPaginaActual(1)
    cargarInstituciones(1)
  }

  const limpiarFiltros = () => {
    setFiltros({ nombre: '', identificador: '', estado: 'todos' })
    setPaginaActual(1)
    cargarInstituciones(1)
  }

  const abrirModalCrear = () => {
    setInstitucionEditando(null)
    setFormData({
      nombre: '',
      identificador: '',
      ciudad_id: '',
      estado: 'pendiente'
    })
    setModalAbierto(true)
  }

  const abrirModalEditar = (institucion: Institucion) => {
    setInstitucionEditando(institucion)
    setFormData({
      nombre: institucion.nombre,
      identificador: institucion.identificador,
      ciudad_id: institucion.ciudad_id.toString(),
      estado: institucion.estado
    })
    setModalAbierto(true)
  }

  const guardarInstitucion = async () => {
    try {
      if (!formData.nombre || !formData.identificador || !formData.ciudad_id) {
        toast.error('Por favor completa todos los campos requeridos')
        return
      }

      const data = {
        nombre: formData.nombre,
        identificador: formData.identificador,
        ciudad_id: parseInt(formData.ciudad_id),
        estado: formData.estado
      }

      let response
      if (institucionEditando) {
        response = await adminService.actualizarInstitucion(institucionEditando.id, data)
      } else {
        response = await adminService.crearInstitucion(data)
      }

      if (response.success) {
        toast.success(
          institucionEditando 
            ? 'Institución actualizada exitosamente' 
            : 'Institución creada exitosamente'
        )
        setModalAbierto(false)
        cargarInstituciones(paginaActual)
      } else {
        toast.error(response.message || 'Error al guardar la institución')
      }
    } catch (error: any) {
      console.error('Error al guardar institución:', error)
      if (error.response?.data?.errors) {
        const errores = Object.values(error.response.data.errors).flat()
        toast.error(errores.join(', '))
      } else {
        toast.error('Error al guardar la institución')
      }
    }
  }

  const cambiarEstadoInstitucion = async (id: number, nuevoEstado: 'activo' | 'inactivo' | 'pendiente') => {
    try {
      const response = await adminService.actualizarInstitucion(id, { estado: nuevoEstado })
      if (response.success) {
        toast.success('Estado actualizado exitosamente')
        cargarInstituciones(paginaActual)
      } else {
        toast.error(response.message || 'Error al actualizar el estado')
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Activa</Badge>
      case 'inactivo':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactiva</Badge>
      case 'pendiente':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Instituciones</CardTitle>
              <CardDescription>
                Administra las instituciones registradas en el sistema
              </CardDescription>
            </div>
            <Button onClick={abrirModalCrear}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir Nueva Institución
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtro-nombre">Nombre</Label>
              <Input
                id="filtro-nombre"
                placeholder="Buscar por nombre..."
                value={filtros.nombre}
                onChange={(e) => setFiltros(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtro-identificador">Identificador</Label>
              <Input
                id="filtro-identificador"
                placeholder="Buscar por identificador..."
                value={filtros.identificador}
                onChange={(e) => setFiltros(prev => ({ ...prev, identificador: e.target.value }))}
              />
            </div>
            <div className="min-w-[150px]">
              <Label htmlFor="filtro-estado">Estado</Label>
              <Select value={filtros.estado} onValueChange={(value) => setFiltros(prev => ({ ...prev, estado: value }))}>
                <SelectTrigger id="filtro-estado">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activa</SelectItem>
                  <SelectItem value="inactivo">Inactiva</SelectItem>
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
                      <TableHead>Identificador</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ciudad</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instituciones?.data.map((institucion) => (
                      <TableRow key={institucion.id}>
                        <TableCell className="font-medium">{institucion.id}</TableCell>
                        <TableCell>{institucion.nombre}</TableCell>
                        <TableCell>{institucion.identificador}</TableCell>
                        <TableCell>{getEstadoBadge(institucion.estado)}</TableCell>
                        <TableCell>
                          {institucion.ciudad?.nombre || 'N/A'}
                          {institucion.ciudad?.estado && (
                            <div className="text-xs text-muted-foreground">
                              {institucion.ciudad.estado.nombre}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalEditar(institucion)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            {institucion.estado === 'pendiente' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => cambiarEstadoInstitucion(institucion.id, 'activo')}
                              >
                                Aprobar
                              </Button>
                            )}
                            <Select
                              value={institucion.estado}
                              onValueChange={(value: 'activo' | 'inactivo' | 'pendiente') => 
                                cambiarEstadoInstitucion(institucion.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activo">Activa</SelectItem>
                                <SelectItem value="inactivo">Inactiva</SelectItem>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {instituciones && instituciones.last_page > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {instituciones.from} a {instituciones.to} de {instituciones.total} instituciones
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cargarInstituciones(paginaActual - 1)}
                      disabled={paginaActual <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      Página {paginaActual} de {instituciones.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cargarInstituciones(paginaActual + 1)}
                      disabled={paginaActual >= instituciones.last_page}
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

      {/* Modal para crear/editar institución */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {institucionEditando ? 'Editar Institución' : 'Nueva Institución'}
            </DialogTitle>
            <DialogDescription>
              {institucionEditando 
                ? 'Modifica los datos de la institución' 
                : 'Completa los datos para crear una nueva institución'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre de la institución"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="identificador">Identificador *</Label>
              <Input
                id="identificador"
                value={formData.identificador}
                onChange={(e) => setFormData(prev => ({ ...prev, identificador: e.target.value }))}
                placeholder="Código único de la institución"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ciudad_id">Ciudad ID *</Label>
              <Input
                id="ciudad_id"
                type="number"
                value={formData.ciudad_id}
                onChange={(e) => setFormData(prev => ({ ...prev, ciudad_id: e.target.value }))}
                placeholder="ID de la ciudad"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estado">Estado</Label>
              <Select 
                value={formData.estado} 
                onValueChange={(value: 'activo' | 'inactivo' | 'pendiente') => 
                  setFormData(prev => ({ ...prev, estado: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="activo">Activa</SelectItem>
                  <SelectItem value="inactivo">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarInstitucion}>
              {institucionEditando ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}