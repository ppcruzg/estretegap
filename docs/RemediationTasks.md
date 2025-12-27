# Listado de Tareas Técnicas Ejecutables

Basado en el Plan de Remediación Técnico.

## Corto Plazo

### Tarea 1: Restringir acceso temporal en tablas críticas <span style="color: green; font-weight: bold;">✅ COMPLETADA: 17/12/2025, 22:00 PM UTC-6</span>
- **Objetivo**: Desactivar operaciones de creación/modificación en tablas bajo política RLS "allow all" para prevenir brechas de seguridad.
- **Archivos / módulos impactados**: Repositorio de autenticación y permisos (estrategiaRepository.ts, pageView.tsx).
- **Riesgo**: Alto
- **Prioridad**: P1
- **Dependencias**: Ninguna (implementado en frontend).
- **Criterio de aceptación**: Operaciones críticas solo accesibles para usuarios autorizados, sin acceso global.
- **Implementación**: Agregadas verificaciones de permisos basadas en can_edit y roles históricos. Usuarios con canEdit o role admin/owner pueden crear, actualizar o eliminar páginas.
- **RESTAURACIÓN 17/12/2025**: Restringido a usuarios con permisos apropiados, no solo superadmins.

### Tarea 2: Alinear modelo de permisos frontend y backend <span style="color: green; font-weight: bold;">✅ COMPLETADA: 17/12/2025, 22:13 PM UTC-6</span>
- **Objetivo**: Unificar el campo utilizado para control de permisos (`role` vs `can_edit`) entre frontend y backend.
- **Archivos / módulos impactados**: usePagePermission.ts, pageGuards.ts, pageView.tsx.
- **Riesgo**: Alto
- **Prioridad**: P1
- **Dependencias**: Ninguna (alineado a can_edit usado en backend).
- **Criterio de aceptación**: Campo único usado consistentemente en frontend y backend para control de acceso.
- **Implementación**: Cambiado usePagePermission para usar can_edit en lugar de role. Actualizado pageGuards y pageView para usar boolean canEdit. Modificado insert de permisos para usar can_edit: true.
- **HOTFIX 17/12/2025**: Aplicado cálculo compatible: canEdit = can_edit === true OR role in ('admin','owner') para restaurar operaciones de escritura con permisos históricos.

### Tarea 3: Documentar permisos y roles existentes <span style="color: green; font-weight: bold;">✅ COMPLETADA: 17/12/2025, 22:33 PM UTC-6</span>
- **Objetivo**: Crear documentación clara de permisos y roles actuales y comunicar a equipos.
- **Archivos / módulos impactados**: docs/PermissionsRoles.md, README.md.
- **Riesgo**: Medio
- **Prioridad**: P2
- **Dependencias**: Ninguna.
- **Criterio de aceptación**: Documento actualizado en docs/ con permisos y roles definidos, revisado por equipos.
- **Implementación**: Creado docs/PermissionsRoles.md con documentación completa del sistema de permisos. Actualizado README.md con referencias a la documentación.

### Tarea 4: Controlar logs excesivos en producción <span style="color: green; font-weight: bold;">✅ COMPLETADA: 17/12/2025, 22:37 PM UTC-6</span>
- **Objetivo**: Eliminar o controlar logs dispersos para reducir ruido y riesgos de seguridad.
- **Archivos / módulos impactados**: estrategiaRepository.ts, supabaseClient.ts, columnService.ts, CompanyContext.tsx.
- **Riesgo**: Medio
- **Prioridad**: P2
- **Dependencias**: Revisión de código base.
- **Criterio de aceptación**: Logs minimizados en producción, solo esenciales para debugging.
- **Implementación**: Envuelto todos los console.log en condicionales import.meta.env.DEV para que solo se ejecuten en desarrollo.

### Tarea 5: Implementar manejo básico de errores en UI
- **Objetivo**: Agregar manejo visible de errores en UI para operaciones críticas.
- **Archivos / módulos impactados**: Componentes de UI para CRUD (páginas, columnas, ítems).
- **Riesgo**: Medio
- **Prioridad**: P2
- **Dependencias**: Ninguna.
- **Criterio de aceptación**: Errores mostrados claramente al usuario en operaciones fallidas.

## Mediano Plazo

### Tarea 6: Migrar datos legacy a esquema autorizado
- **Objetivo**: Migrar datos legacy en `company_users.user_id` para cumplir con RLS y seguridad.
- **Archivos / módulos impactados**: Scripts de migración en Supabase, tablas `company_users`.
- **Riesgo**: Alto
- **Prioridad**: P1
- **Dependencias**: Acceso a base de datos de producción.
- **Criterio de aceptación**: Datos legacy migrados, RLS funcionando correctamente.

### Tarea 7: Implementar persistencia de ordenamiento drag & drop
- **Objetivo**: Completar persistencia de ordenamiento para columnas e ítems.
- **Archivos / módulos impactados**: Componentes de UI para drag & drop, servicios de actualización de posición.
- **Riesgo**: Medio
- **Prioridad**: P2
- **Dependencias**: Modelo de datos estable.
- **Criterio de aceptación**: Cambios de orden guardados persistentemente en base de datos.

### Tarea 8: Consolidar servicios duplicados
- **Objetivo**: Eliminar o integrar servicios legacy duplicados en `lib/db/*Service.ts`.
- **Archivos / módulos impactados**: Servicios en `lib/db/`, repositorio principal.
- **Riesgo**: Medio
- **Prioridad**: P2
- **Dependencias**: Revisión de código legacy.
- **Criterio de aceptación**: Servicios unificados, sin duplicidad.

### Tarea 9: Documentar operaciones y políticas RLS
- **Objetivo**: Crear documentación clara de operaciones y políticas RLS.
- **Archivos / módulos impactados**: docs/, README.md.
- **Riesgo**: Bajo
- **Prioridad**: P3
- **Dependencias**: Ninguna.
- **Criterio de aceptación**: Documento completo de operaciones y RLS en docs/.

## Largo Plazo

### Tarea 10: Desarrollar UI para administración de permisos
- **Objetivo**: Crear interfaz para gestión de permisos y roles por página.
- **Archivos / módulos impactados**: Nuevos componentes de UI, contextos de permisos.
- **Riesgo**: Alto
- **Prioridad**: P1
- **Dependencias**: Modelo de permisos alineado.
- **Criterio de aceptación**: UI funcional para administrar permisos por página.

### Tarea 11: Implementar pruebas automatizadas y validaciones
- **Objetivo**: Agregar pruebas y validaciones de seguridad en CI/CD.
- **Archivos / módulos impactados**: Archivos de pruebas, configuración CI/CD.
- **Riesgo**: Medio
- **Prioridad**: P2
- **Dependencias**: Estabilidad del sistema.
- **Criterio de aceptación**: Suite de pruebas ejecutándose en CI/CD.

### Tarea 12: Homogeneizar nomenclaturas y modelo de datos
- **Objetivo**: Revisar y unificar nomenclaturas entre frontend y backend.
- **Archivos / módulos impactados**: Tipos, servicios, tablas de base de datos.
- **Riesgo**: Medio
- **Prioridad**: P2
- **Dependencias**: Ninguna.
- **Criterio de aceptación**: Nomenclaturas consistentes en todo el proyecto.

### Tarea 13: Definir proceso de manejo de errores
- **Objetivo**: Mejorar manejo y logging de errores en toda la aplicación.
- **Archivos / módulos impactados**: Componentes de UI, servicios de backend.
- **Riesgo**: Bajo
- **Prioridad**: P3
- **Dependencias**: Ninguna.
- **Criterio de aceptación**: Estrategia definida y aplicada para errores.

---

Última actualización: 17/12/2025, 23:07 PM UTC-6
Fin del Listado de Tareas Técnicas Ejecutables v1
