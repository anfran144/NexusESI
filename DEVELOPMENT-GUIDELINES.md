# Guía para el Desarrollo de Nuevas Funcionalidades

**¡Recordatorio!** Antes de empezar a codificar una nueva funcionalidad, sigue esta guía para asegurar que se integra correctamente con la arquitectura del proyecto NexusESI.

## Principio Fundamental: "Permission-First"

Toda funcionalidad que requiera control de acceso debe ser gobernada por **permisos**, no por roles. El backend es la única fuente de verdad sobre lo que un usuario puede hacer. El frontend solo refleja esos permisos.

---

## 1. Desarrollo del Backend (Laravel)

### Paso 1.1: Definir Permisos
¿La nueva funcionalidad introduce nuevas acciones que deben ser restringidas?

-   **Sí**: Ve a `database/seeders/PermissionSeeder.php` y define los nuevos permisos. Sé granular.
    -   Mal: `manage-projects`
    -   Bien: `projects.create`, `projects.view`, `projects.update`, `projects.delete`, `projects.assign-users`

### Paso 1.2: Actualizar Roles
Asigna los nuevos permisos a los roles existentes en `database/seeders/RoleSeeder.php`.

```php
$role = Role::findByName('coordinator');
$role->givePermissionTo(['projects.create', 'projects.view']);
```

### Paso 1.3: Crear/Actualizar Políticas (Policies)
Para cada modelo implicado, crea o actualiza su política para protegerlo a nivel de instancia.

-   Genera la política si no existe: `php artisan make:policy MyModelPolicy --model=MyModel`
-   Regístrala en `app/Providers/AuthServiceProvider.php`.
-   Implementa los métodos (`view`, `create`, `update`, `delete`, etc.) usando la lógica de permisos del usuario.

```php
// En app/Policies/MyModelPolicy.php
public function update(User $user, MyModel $myModel): bool
{
    // ¿Tiene el permiso general?
    if (!$user->hasPermissionTo('mymodel.update')) {
        return false;
    }
    // ¿Puede actuar sobre ESTE objeto en particular?
    return $user->id === $myModel->user_id;
}
```

### Paso 1.4: Crear Rutas y Controladores
-   Define las nuevas rutas en `routes/api.php`.
-   En el controlador, **autoriza cada acción** usando la política antes de ejecutar cualquier lógica.

```php
// En app/Http/Controllers/Api/MyModelController.php
public function update(Request $request, MyModel $myModel)
{
    $this->authorize('update', $myModel); // ¡CRÍTICO!

    // ... tu lógica de actualización ...
}
```

### Paso 1.5: Refrescar la Base de Datos
Aplica los cambios ejecutando: `php artisan migrate:fresh --seed`.

---

## 2. Desarrollo del Frontend (React)

### Paso 2.1: Actualizar el Servicio de API
En la carpeta `src/services`, crea o modifica el servicio para que incluya las funciones que consumen los nuevos endpoints de la API.

### Paso 2.2: Gestionar el Estado (Zustand)
Si la nueva funcionalidad requiere un estado global, crea o actualiza un store en `src/stores`.

### Paso 2.3: Construir la Interfaz de Usuario
Crea tus componentes en `src/components` o `src/features`.

### Paso 2.4: ¡Controlar la UI con Permisos!
Para mostrar/ocultar elementos de la UI (botones, menús, enlaces), **DEBES** usar el hook `usePermissions`. **NUNCA uses el rol del usuario directamente.**

```tsx
import { usePermissions } from '@/hooks/usePermissions';

const MyComponent = () => {
    const { hasPermission } = usePermissions();

    return (
        <div>
            {hasPermission('mymodel.create') && (
                <Button>Crear Nuevo Modelo</Button>
            )}
        </div>
    );
};
```

Si es un item de menú en el sidebar, recuerda añadir la propiedad `permission` en `src/components/layout/data/role-sidebar-data.ts`.

---

## 3. Checklist de Integración

-   [ ] **Backend**: ¿Se han creado los permisos?
-   [ ] **Backend**: ¿Se han asignado los permisos a los roles en el seeder?
-   [ ] **Backend**: ¿Se ha creado y registrado la Política?
-   [ ] **Backend**: ¿Los métodos del controlador llaman a `$this->authorize()`?
-   [ ] **Backend**: ¿Se ha refrescado la base de datos con `migrate:fresh --seed`?
-   [ ] **API**: ¿El endpoint `/api/auth/me` devuelve los nuevos permisos para el usuario logueado? (Verifícalo en las herramientas de desarrollo del navegador).
-   [ ] **Frontend**: ¿El servicio de API está actualizado?
-   [ ] **Frontend**: ¿La UI se controla con el hook `usePermissions` y no con roles?
-   [ ] **Frontend**: ¿Los elementos del sidebar usan la propiedad `permission`?
-   [ ] **General**: ¿La funcionalidad se comporta como se espera para diferentes usuarios con diferentes permisos?