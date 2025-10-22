# Actualización de Paleta Corporativa - NexusESI Frontend

## Resumen de Cambios

Se ha actualizado sistemáticamente la paleta de colores corporativos en toda la aplicación para mantener coherencia con la nueva identidad de marca.

## Archivos Modificados

### 1. `src/styles/theme.css`
- **Modo Claro (`:root`)**:
  - Background: `oklch(0.96 0.004 247.896)` - Tono cálido base
  - Foreground: `oklch(0.22 0.02 225)` - Azul oscuro corporativo
  - Primary: `oklch(0.42 0.08 225)` - Azul corporativo principal (#54668E)
  - Accent: `oklch(0.55 0.06 225)` - Azul claro corporativo (#879EC6)
  - Secondary: `oklch(0.92 0.006 247.896)` - Gris claro (#E8E8E8)

- **Modo Oscuro (`.dark`)**:
  - Background: `oklch(0.15 0.02 225)` - Azul oscuro corporativo (#1D2B3F)
  - Primary: `oklch(0.55 0.06 225)` - Azul claro como primario
  - Accent: `oklch(0.42 0.08 225)` - Azul medio como accent

- **Colores de Gráficos**: Actualizados para usar variaciones de la paleta azul corporativa

### 2. `src/features/settings/appearance/appearance-form.tsx`
- Reemplazados colores hardcodeados (`#ecedef`) por variables CSS
- Uso de `bg-secondary`, `bg-primary`, `bg-accent`, `bg-muted`

### 3. `src/components/theme-switch.tsx`
- Actualizado meta theme-color para usar los nuevos colores corporativos
- Modo claro: `oklch(0.96 0.004 247.896)`
- Modo oscuro: `oklch(0.15 0.02 225)`

## Paleta de Colores Corporativa

### Colores Principales
- **Azul Oscuro**: #363955 (oklch(0.22 0.02 225))
- **Azul Principal**: #54668E (oklch(0.42 0.08 225))
- **Azul Claro**: #879EC6 (oklch(0.55 0.06 225))
- **Gris Claro**: #E8E8E8 (oklch(0.92 0.006 247.896))
- **Fondo Cálido**: #F5F6E6 (oklch(0.96 0.004 247.896))

### Aplicación en Componentes
- Todos los componentes UI utilizan las variables CSS actualizadas
- Consistencia mantenida entre modo claro y oscuro
- Gráficos y charts actualizados con la nueva paleta

## Beneficios de la Actualización

1. **Coherencia Visual**: Todos los elementos mantienen la identidad corporativa
2. **Accesibilidad**: Contraste mejorado entre elementos
3. **Mantenibilidad**: Uso de variables CSS facilita futuras actualizaciones
4. **Responsive**: Funciona correctamente en ambos modos (claro/oscuro)

## Verificación

La aplicación está funcionando correctamente en `http://localhost:5173/` con la nueva paleta aplicada sistemáticamente en todos los componentes.