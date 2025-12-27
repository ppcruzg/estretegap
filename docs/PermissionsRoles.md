# Documentación de Permisos y Roles

Fecha: 17/12/2025

## Visión General

Este documento describe el sistema de permisos y roles implementado en la aplicación ESTRATEGA, incluyendo niveles globales, de empresa y de página.

## Niveles de Permisos

### 1. Nivel Global (Superadmin)
- **Campo**: `profiles.is_admin` (boolean)
- **Descripción**: Usuario con acceso completo al sistema
- **Permisos**:
  - Acceso a todas las empresas
  - Creación, edición y eliminación de páginas (restringido temporalmente)
  - Gestión de usuarios y empresas
  - Acceso a funciones administrativas

### 2. Nivel Empresa
- **Campo**: `company_users.role` (string)
- **Roles disponibles**:
  - `company-admin`: Administrador de empresa
  - `company-user`: Usuario estándar de empresa
- **Permisos por rol**:
  - **company-admin**:
    - Crear páginas en la empresa
    - Gestionar usuarios de la empresa
    - Acceso completo a todas las páginas de la empresa
  - **company-user**:
    - Acceso limitado según permisos específicos por página

### 3. Nivel Página
- **Campo**: `permissions.can_edit` (boolean)
- **Descripción**: Control de edición por página individual
- **Permisos**:
  - `true`: Puede editar la página (crear/modificar columnas, ítems, etc.)
  - `false`: Solo lectura en la página

## Tabla de Permisos

| Nivel | Campo | Tipo | Descripción | Valores |
|-------|-------|------|-------------|---------|
| Global | profiles.is_admin | boolean | Superusuario | true/false |
| Empresa | company_users.role | string | Rol en empresa | company-admin, company-user |
| Página | permissions.can_edit | boolean | Edición por página | true/false |

## Lógica de Acceso

### Creación de Páginas
- Solo superadmins pueden crear páginas (restricción temporal implementada)
- Los creadores obtienen automáticamente permisos de edición (can_edit: true)

### Edición de Páginas
- Superadmins: Siempre pueden editar
- Otros usuarios: Según permissions.can_edit por página

### Eliminación de Páginas
- Solo superadmins pueden eliminar páginas (restricción temporal implementada)

### Acceso a Empresas
- Superadmins: Todas las empresas
- Usuarios empresa: Solo su empresa asignada

## Restricciones Temporales Activas

Debido a políticas RLS permisivas en backend, se han implementado restricciones temporales:

1. **Creación de páginas**: Solo superadmins
2. **Edición de páginas**: Solo superadmins
3. **Eliminación de páginas**: Solo superadmins

Estas restricciones se mantendrán hasta que se implementen políticas RLS apropiadas en el backend.

## Modelo de Datos Relacionado

### Tablas Principales
- `profiles`: Información de usuario y flag superadmin
- `companies`: Empresas
- `company_users`: Relación usuario-empresa con roles
- `pages`: Páginas por empresa
- `permissions`: Permisos específicos por página

### Relaciones
```
profiles (1) ──── (N) company_users (N) ──── (1) companies
                       │
                       └─── (N) permissions (N) ──── (1) pages
```

## Implementación en Código

### Frontend
- `useAuth`: Proporciona isSuperAdmin y companyRole
- `usePagePermission`: Verifica can_edit por página
- `getPageCapabilities`: Determina permisos basados en can_edit

### Backend
- RLS usa `permissions.can_edit` para control de acceso
- Políticas actuales permiten acceso global (requiere corrección)

## Próximos Pasos

1. Implementar políticas RLS correctas en Supabase
2. Remover restricciones temporales del frontend
3. Expandir modelo de permisos granular (owner/editor/viewer)
4. Desarrollar UI para gestión de permisos

## Contacto

Para preguntas sobre permisos o solicitudes de acceso, contactar al equipo de desarrollo.

---

Fin de Documentación de Permisos y Roles v1
