```markdown
# Product Requirement Document (PRD) v1.1  
Estado: Activo

---

## 1. Visión del producto  
Sistema para gestionar tableros estratégicos multiempresa que permite crear, organizar y controlar páginas, columnas y tarjetas con estados configurables y un modelo granular de roles y permisos que asegura integridad y control.

---

## 2. Objetivo del sistema  
Centralizar la gestión operativa de iniciativas estratégicas en múltiples empresas, proporcionando interfaces para gestión completa de páginas, grupos (columnas), items, estados y documentación, con seguridad garantizada mediante roles y reglas de negocio basadas en RLS.

---

## 3. Alcance  

### En alcance  
- Autenticación y gestión de sesión vía Supabase Auth.  
- Gestión multiempresa para usuarios con múltiples asignaciones.  
- CRUD de páginas, columnas, items y estados configurables ligados a empresa y permisos.  
- Control y visualización de links de documentación.  

### Fuera de alcance  
- Administración avanzada o UI para gestión explícita de permisos y roles (construcción pendiente).  
- Funcionalidades adicionales no implementadas ni siquiera parcialmente (p.ej., workflows, reportes avanzados).  

---

## 4. Tipos de usuarios y roles  

### Modelo de Permisos actualizado  

#### Backend (Supabase / RLS)  
- La fuente de verdad para roles y permisos es la tabla `company_users.role`.  
- Roles soportados explícitamente:  
  - `owner` (principalmente a nivel de página).  
  - `company-admin` (administrador de la empresa).  
  - `company-user` (usuario estándar dentro de empresa).  
- RLS actúa como la autoridad última de seguridad, garantizando control sobre acceso a datos y operaciones.  

#### Frontend  
- El valor `canEdit` es un atributo **derivado**, nunca persistido directamente.  
- `canEdit` puede tomar los valores `true`, `false` o `null` (cuando los permisos aún se están cargando).  
- La interfaz no bloquea la ejecución de acciones hasta que los permisos se resuelven por completo, aceptando un período en que `canEdit` puede ser `null`.  

---

## 5. Usuarios – Empresas (Actualizado)  
- Un usuario puede pertenecer a **múltiples** empresas simultáneamente.  
- La relación `company_users` siempre debe tratarse como un **arreglo** de entradas y nunca asumir un único rol global para el usuario.  
- Por esta razón, en consultas y lógica se debe **evitar el uso de `.single()`** o métodos que asuman cardinalidad 1, para no limitar el modelo real 1-N.  

---

## 6. Páginas (Actualizado)  

### Operaciones de páginas  
- Acciones como crear, renombrar o eliminar páginas deben tener una clara **validación de intención en frontend**, pero esta no sustituye la seguridad.  
- La seguridad final sobre qué usuarios pueden ejecutar qué operaciones está garantizada exclusivamente por las políticas RLS en backend.  
- Los repositorios (`estrategiaRepository`) que realizan las operaciones CRUD sobre páginas **no realizan validación de permisos** y asumen que el usuario/app tiene autorización adecuada.  

---

## 7. Principios de Arquitectura Nuevos  

- Los repositorios **nunca deciden ni validan permisos**; su responsabilidad se limita a la comunicación con la base de datos.  
- Los guards y protección del flujo se ejecutan exclusivamente en el **frontend**, decidiendo la accesibilidad de componentes y funcionalidades.  
- La seguridad definitiva reside en las políticas **RLS** definidas en Supabase, que actúan como frontera.  
- Las **relaciones 1-N nunca se consultan como un único objeto** o entidad simple; se debe usar siempre acceso en forma de arreglos o listas, respetando la cardinalidad real de los datos.  

---

## 8. Módulos del sistema  
- Autenticación y sesión (login, registro, logout).  
- Gestión de empresa activa.  
- Gestión y consulta de páginas por empresa.  
- Administración de columnas (grupos) con estados base y ordenación.  
- Administración de tarjetas/items vinculadas a columnas.  
- Configuración dinámica de estados de columnas.  
- Gestión de links de documentación dado por página.  

---

## 9. Funcionalidades por módulo  
- Autenticación: operaciones estándar login, signup, logout, obtener usuario y sesión actual, escuchar cambios de sesión.  
- Empresa: obtener listado de empresas asociadas a usuario, seleccionar empresa activa.  
- Páginas: listado, creación, actualización, eliminación (incluye cargar junto con columnas, items, estados, links).  
- Columnas: creación (asocia estados base), actualización, eliminación, reordenamiento por posición.  
- Ítems: creación (con estado por defecto “pendiente” si existe), edición, eliminación y posicionamiento.  
- Estados: inserción, actualización y eliminación controladas para mantener la configuración por columna.  
- Links: crear, editar, eliminar links asociados a páginas.  

---

## 10. Flujos clave de usuario  
- Usuario inicia sesión y se carga perfil con rol y empresa activa.  
- Obtiene lista de páginas filtrada por empresa activa.  
- Selecciona página para ver su contenido, columnas, estados, items y links asociados.  
- Realiza creación o edición de páginas, columnas, ítems y estados dentro de la página activa.  
- Administra enlaces de documentación vinculados a cada página.  

---

## 11. Modelo de datos (Supabase)  
Entidades principales detectadas:  
- `profiles` (usuario y flag superadmin).  
- `companies` (empresas).  
- `company_users` (relación usuario-empresa con roles).  
- `pages` (páginas por empresa).  
- `columns` (grupos por página).  
- `column_status_categories` (estados de columnas).  
- `items` (tarjetas por columna).  
- `documentation_links` (links asociados a páginas).  
- `footer_metrics` (datos ligados a páginas, no visibles en UI).  

Relaciones implícitas:  
- companies 1:N pages  
- pages 1:N columns  
- columns 1:N items  
- columns 1:N column_status_categories  
- pages 1:N documentation_links, footer_metrics  

Constraints: No definidas en código fuente (Pendiente de definición).  

---

## 12. Seguridad, roles y permisos  
- Autenticación gestionada mediante Supabase Auth.  
- Roles definidos en `profiles` (superadmin) y `company_users` (roles empresa).  
- Permisos a nivel página mencionados pero sin implementación clara ni UI.  
- Reglas de seguridad por RLS en backend (detalles no implementados en frontend).  

---

## 13. Reglas de negocio  
- Se permite operar sobre datos sólo para la empresa activa seleccionada.  
- Creación de columnas incluye inserción automática de estados base predefinidos.  
- Items nuevos asignan estado “pendiente” sólo si existe configurado para la columna.  
- Ordenamiento de columnas e ítems se basa en campo numérico de posición.  
- El sistema lanza errores en las operaciones ante fallos, pero no hay manejo avanzado en UI.  

---

## 14. Integraciones  
- Supabase (Autenticación y base de datos PostgreSQL).  
- Frameworks frontend: React y React Router.  

---

## 15. Riesgos y deuda técnica  
- Uso abundante de logs (`console.log`) en código de producción.  
- Ausencia de manejo robusto y consistente de errores en UI.  
- Servicios auxiliares DB parcialmente sin uso o legacy.  
- Persistencia limitada o inconsistente en reordenamiento UI.  
- Dependencia fuerte del esquema y estructura del repositorio puede causar fragilidad.  
- Roles y permisos incompletos o solo parcialmente aplicados.  

---

## 16. Supuestos y dependencias  
- Variables de entorno necesarias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.  
- Datos limpios y consistentes en tablas `company_users` y `profiles`.  
- Gestión de roles solo con datos presentes en base de datos y sin intermediarios adicionales.  

---

## 17. Pendientes / Gaps  
- Implementación y visibilidad completas de permisos y gestión granular por página (No implementado).  
- Definición, visibilidad y coordinación de políticas RLS (Pendiente de definición).  
- Procedimientos para manejo de datos legacy o migraciones (Pendiente de definición).  
- Estrategias para manejo y recuperación ante errores en frontend (No implementado).  
- Coordinación e integración de métricas footer con UI (Pendiente de definición).  
- Pruebas automatizadas y validaciones de código (No implementado).  
- UI o mecanismos para gestión y administración de permisos por página (No implementado).  

---

## 15. Deuda Técnica (Technical Debt)

### Seguridad y Autenticación

#### 1. Row-Level Security (RLS) - CRÍTICO
**Estado:** Deshabilitado temporalmente en desarrollo  
**Tablas afectadas:** `profiles`, `company_users`  
**Impacto:** Sin RLS, cualquier usuario autenticado puede acceder/modificar datos de otros usuarios.

**Acciones requeridas:**
- Re-habilitar RLS en ambas tablas antes de producción
- Crear políticas RLS que permitan a Company Admins:
  - Crear perfiles para usuarios de su empresa
  - Asignar usuarios a su empresa
  - Modificar roles de usuarios de su empresa
- Mantener políticas que permitan a Superadmins gestionar cualquier usuario
- Validar que usuarios solo puedan ver/editar su propio perfil

**SQL pendiente:**
```sql
-- Re-habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Crear políticas apropiadas (ver docs/db.md para detalles)
```

#### 2. Gestión de Contraseñas - ALTA PRIORIDAD
**Estado:** Usando contraseña temporal hardcodeada (`Invitado2025!`)  
**Impacto:** Riesgo de seguridad, todos los usuarios invitados tienen la misma contraseña inicial.

**Opciones de mejora:**
1. **Flujo de Reset Password (Recomendado):**
   - Enviar email de "reset password" en lugar de contraseña temporal
   - Usuario define su propia contraseña segura desde el inicio
   - Implementar en `adminRepository.ts` usando `supabase.auth.resetPasswordForEmail()`

2. **Feature: Cambiar Contraseña:**
   - Agregar sección en perfil de usuario para cambiar contraseña
   - Validar contraseña actual antes de permitir cambio
   - Aplicar políticas de contraseñas seguras

3. **Contraseña Temporal Generada:**
   - Generar contraseña aleatoria única por usuario
   - Enviar por email al usuario
   - Forzar cambio en primer login

#### 3. Confirmación de Email - MEDIA PRIORIDAD
**Estado:** Auto-confirmación mediante API de admin  
**Impacto:** Depende de permisos de Service Role Key, puede fallar silenciosamente.

**Acciones requeridas:**
- Configurar proveedor SMTP real (SendGrid, AWS SES, Mailgun)
- Configurar templates de email en Supabase
- Implementar manejo de errores cuando auto-confirmación falla
- Considerar deshabilitar auto-confirmación en producción

**Configuración pendiente:**
- Supabase Dashboard → Authentication → Email Templates
- Configurar SMTP en Supabase Settings

#### 4. Validación de Permisos en Frontend
**Estado:** Guards básicos implementados  
**Impacto:** Posible exposición de UI no autorizada mientras se cargan permisos.

**Mejoras sugeridas:**
- Implementar loading states más robustos
- Ocultar acciones no autorizadas durante carga de permisos
- Agregar mensajes de error claros cuando permisos son insuficientes

---

# PRD.history.md


## Historial de Cambios

### Versión 1.1 – Post Hotfix  
- Alineación del modelo de permisos con el estado real del sistema:  
  - Fuente de verdad: `company_users.role` en backend.  
  - Rol `canEdit` en frontend es atributo derivado y puede ser `true`, `false` o `null` mientras se cargan permisos.  
  - Frontend no bloquea acciones mientras se resuelven permisos.  
- Soporte explícito para usuarios multiempresa:  
  - `company_users` tratado siempre como arreglo.  
  - Rechazo del uso de `.single()` en relaciones 1-N.  
- Clarificación sobre páginas:  
  - Validación de intención en frontend sin reemplazar seguridad backend.  
  - Repositorios no validan permisos, seguridad final en RLS.  
- Inclusión de Principios de Arquitectura:  
  - Repositorios no deciden permisos.  
  - Guards viven en frontend.  
  - Seguridad definitiva está en RLS.  
  - Relaciones 1-N consultadas siempre como listas, nunca como objeto único.  

---

# PRD.v1.0.md

**Documento histórico – no vigente**

Este documento contiene la versión original del PRD (v1.0) previo al hotfix y a los alineamientos realizados con base en el sistema real. No debe usarse como referencia para desarrollo o definición actual.

```