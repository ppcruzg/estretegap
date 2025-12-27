⚠️ DOCUMENTO HISTÓRICO – NO VIGENTE

Este documento corresponde al PRD original (v1.0).
Se conserva únicamente como referencia histórica.
El PRD activo es PRD.md (v1.1 o superior).

# Product Requirement Document (PRD) v1

Basado exclusivamente en el análisis técnico del código fuente, reflejando el sistema tal como existe hoy.

---

## 1. Visión del producto  
Sistema para gestionar tableros estratégicos por empresa que permita crear, editar y organizar páginas, grupos (columnas) y tarjetas con estados configurables, manteniendo controles de acceso basados en roles de usuario y empresa.

---

## 2. Objetivo del sistema  
Centralizar la gestión operativa de iniciativas estratégicas, permitiendo administrar entidades como páginas, columnas, ítems y estados, garantizando integridad de datos y control básico de acceso.

---

## 3. Alcance  

### En alcance  
- Autenticación y manejo de sesión mediante Supabase Auth (login, signup, logout).  
- Gestión de empresa activa para usuarios autenticados (listado y selección).  
- CRUD sobre páginas de estrategia, asociados a empresas.  
- CRUD sobre columnas/grupos dentro de páginas, con atributos como posición y color; creación incluye configuración de estados base.  
- CRUD sobre tarjetas/items dentro de columnas, con estado, posición y texto descriptivo.  
- Configuración y mantenimiento de estados asociados a cada columna, permitiendo insertar, actualizar y eliminar estados.  
- CRUD básico de links de documentación asociados a páginas.  

### Fuera de alcance  
- Administración avanzada de permisos y roles (UI y backend).  
- Manejo avanzado o persistente de reordenamientos UI no basado en campo posición.  
- Auditoría, logging, o monitoreo avanzado.  
- Pruebas automatizadas o validaciones complejas.  
- Procesos batch, triggers de base de datos o migraciones complejas.  

---

## 4. Tipos de usuarios y roles  
- Usuario autenticado (perfil guardado en `profiles`).  
- Roles a nivel empresa (`company_users.role`), como `company-admin` o `company-user`.  
- Superusuario o superadmin identificado por flag `is_admin` en perfil.  
- Roles y permisos a nivel página: Pendiente de definición / No implementado en UI.  

---

## 5. Arquitectura funcional (alto nivel)  
- Frontend: React con componentes funcionales y hooks, junto con React Context para gestión global (auth, empresa activa, app).  
- Capa de repositorio centraliza las consultas y mutaciones a base de datos mediante Supabase client.  
- Backend: Supabase PostgreSQL usado tanto para persistencia como autenticación, con uso implícito de RLS (implementación no visible en frontend).  

---

## 6. Módulos del sistema  
- Autenticación y sesión (login, registro, logout).  
- Gestión de empresa activa.  
- Gestión y consulta de páginas por empresa.  
- Administración de columnas (grupos) con estados base y ordenación.  
- Administración de tarjetas/items vinculadas a columnas.  
- Configuración dinámica de estados de columnas.  
- Gestión de links de documentación dado por página.  

---

## 7. Funcionalidades por módulo  
- Autenticación: operaciones estándar login, signup, logout, obtener usuario y sesión actual, escuchar cambios de sesión.  
- Empresa: obtener listado de empresas asociadas a usuario, seleccionar empresa activa.  
- Páginas: listado, creación, actualización, eliminación (incluye cargar junto con columnas, items, estados, links).  
- Columnas: creación (asocia estados base), actualización, eliminación, reordenamiento por posición.  
- Ítems: creación (con estado por defecto "pendiente" si existe), edición, eliminación y posicionamiento.  
- Estados: inserción, actualización y eliminación controladas para mantener la configuración por columna.  
- Links: crear, editar, eliminar links asociados a páginas.  

---

## 8. Flujos clave de usuario  
- Usuario inicia sesión y se carga perfil con rol y empresa activa.  
- Obtiene lista de páginas filtrada por empresa activa.  
- Selecciona página para ver su contenido, columnas, estados, items y links asociados.  
- Realiza creación o edición de páginas, columnas, ítems y estados dentro de la página activa.  
- Administra enlaces de documentación vinculados a cada página.  

---

## 9. Modelo de datos (Supabase)  
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

## 10. Seguridad, roles y permisos  
- Autenticación gestionada mediante Supabase Auth.  
- Roles definidos en `profiles` (superadmin) y `company_users` (roles empresa).  
- Permisos a nivel página mencionados pero sin implementación clara ni UI.  
- Reglas de seguridad por RLS en backend (detalles no implementados en frontend).  

---

## 11. Reglas de negocio  
- Se permite operar sobre datos sólo para la empresa activa seleccionada.  
- Creación de columnas incluye inserción automática de estados base predefinidos.  
- Items nuevos asignan estado "pendiente" sólo si existe configurado para la columna.  
- Ordenamiento de columnas e ítems se basa en campo numérico de posición.  
- El sistema lanza errores en las operaciones ante fallos, pero no hay manejo avanzado en UI.  

---

## 12. Integraciones  
- Supabase (Autenticación y base de datos PostgreSQL).  
- Frameworks frontend: React y React Router.  

---

## 13. Riesgos y deuda técnica  
- Uso abundante de logs (`console.log`) en código de producción.  
- Ausencia de manejo robusto y consistente de errores en UI.  
- Servicios auxiliares DB parcialmente sin uso o legacy.  
- Persistencia limitada o inconsistente en reordenamiento UI.  
- Dependencia fuerte del esquema y estructura del repositorio puede causar fragilidad.  
- Roles y permisos incompletos o solo parcialmente aplicados.  

---

## 14. Supuestos y dependencias  
- Variables de entorno necesarias: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.  
- Datos limpios y consistentes en tablas `company_users` y `profiles`.  
- Gestión de roles solo con datos presentes en base de datos y sin intermediarios adicionales.  

---

## 15. Pendientes / Gaps  
- Implementación y visibilidad completas de permisos y gestión granular por página (No implementado).  
- Definición, visibilidad y coordinación de políticas RLS (Pendiente de definición).  
- Procedimientos para manejo de datos legacy o migraciones (Pendiente de definición).  
- Estrategias para manejo y recuperación ante errores en frontend (No implementado).  
- Coordinación e integración de métricas footer con UI (Pendiente de definición).  
- Pruebas automatizadas y validaciones de código (No implementado).  
- UI o mecanismos para gestión y administración de permisos por página (No implementado).  

---

Fin de PRD v1
