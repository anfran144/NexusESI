import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserCheck,
  Settings
} from 'lucide-react';
import { PermissionGate } from '@/components/auth/PermissionGate';

interface Role {
  id: number;
  name: string;
  display_name: string;
  permissions: Permission[];
}

interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

export function PermissionsAdministration() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Aquí irían las llamadas a la API para cargar roles, permisos y usuarios
      // Por ahora simulamos datos
      setRoles([
        {
          id: 1,
          name: 'admin',
          display_name: 'Administrador',
          permissions: [
            { id: 1, name: 'admin.dashboard.view', guard_name: 'web' },
            { id: 2, name: 'admin.users.manage', guard_name: 'web' },
          ]
        },
        {
          id: 2,
          name: 'coordinator',
          display_name: 'Coordinador',
          permissions: [
            { id: 3, name: 'coordinator.dashboard.view', guard_name: 'web' },
            { id: 4, name: 'coordinator.seedbeds.manage', guard_name: 'web' },
          ]
        }
      ]);

      setPermissions([
        { id: 1, name: 'admin.dashboard.view', guard_name: 'web' },
        { id: 2, name: 'admin.users.manage', guard_name: 'web' },
        { id: 3, name: 'coordinator.dashboard.view', guard_name: 'web' },
        { id: 4, name: 'coordinator.seedbeds.manage', guard_name: 'web' },
      ]);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando configuración de permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate permission="admin.roles.manage">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Permisos</h1>
            <p className="text-muted-foreground">
              Administra roles, permisos y asignaciones de usuarios
            </p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Rol
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-muted-foreground">
                Roles configurados en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permisos</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permissions.length}</div>
              <p className="text-xs text-muted-foreground">
                Permisos granulares disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Usuarios con roles asignados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar roles</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Roles y Permisos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gestiona los roles del sistema y sus permisos asociados
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Nombre Técnico</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{role.display_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission.id} variant="secondary" className="text-xs">
                            {permission.name}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Permisos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Vista general de permisos por rol
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Matriz de permisos disponible próximamente</p>
              <p className="text-sm">Esta funcionalidad permitirá una vista detallada de todos los permisos</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
}