# Manual de Operación "DEEP-DIVE": Pantalla Principal - ESTRATEGA

## 1. PROPÓSITO GENERAL
La Pantalla Principal de **ESTRATEGA** es el centro neurálgico para la gestión estratégica organizacional potenciada por IA. Su valor fundamental radica en centralizar la ejecución de proyectos, el seguimiento de indicadores y la documentación de procesos en una interfaz dinámica y visual (tipo Kanban/Diagrama) que permite a los líderes y consultores obtener una visión de 360° del estado de los objetivos estratégicos.

[INSERTAR CAPTURA: Vista General de la Pantalla Principal]

---

## 2. DICCIONARIO DE LA INTERFAZ (UI)

### A. Barra Lateral (Sidebar)
La columna de navegación izquierda permite la conmutación rápida entre diferentes tableros y accesos administrativos.
- **Logotipo ESTRATEGA**: Retorno a la vista principal.
- **Botón Expandir/Colapsar (`<` / `>`)**: Maximiza el área de trabajo ocultando los nombres de las páginas.
- **Lista de Páginas**: Acceso directo a los tableros configurados para la compañía activa.
- **Botón Nueva Página (`+`)**: Crea un nuevo lienzo estratégico (requiere permisos de Admin).
- **Icono Escudo (`Shield`)**: Acceso al Panel Administrativo (Gestión de usuarios y empresas).
- **Botón Cerrar Sesión (`LogOut`)**: Finaliza la sesión de forma segura.

### B. Barra Superior (TopBar)
Contiene las herramientas de configuración del contexto y herramientas avanzadas.
- **Selector de Empresa (`Building2`)**: Permite cambiar entre diferentes organizaciones si el usuario tiene múltiples asignaciones.
- **Título de Página**: Nombre del tablero actual (Editable mediante el icono `Edit3` para usuarios con permisos).
- **Descripción de Página**: Subtítulo explicativo del propósito del tablero (Editable haciendo clic sobre el texto).
- **Selector de Idioma (`Languages`)**: Alterna la interfaz entre Español e Inglés.
- **Conmutador de Tema (`Sun`/`Moon`)**: Cambia entre modo claro y oscuro para confort visual.
- **Icono Roadmap IA (`TrendingUp`)**: Dispara el análisis predictivo y generativo de rutas de mejora.
- **Icono Historial (`Clock`)**: Despliega el panel de auditoría de cambios (Snapshots).
- **Icono Configuración (`Settings`)**: Solo para Superadmins; ajustes globales del sistema.
- **Icono Basura (`Trash2`)**: Elimina el tablero completo (Acción irreversible).
- **Icono Usuarios (`Users`)**: Gestión de permisos específicos para la página actual.

### C. Grupos Estratégicos (Columnas)
Contenedores lógicos que agrupan fases, departamentos o etapas.
- **Título del Grupo**: Definición del eje estratégico (Editable directamente).
- **Icono Paleta (`Palette`)**: Personaliza el color del encabezado del grupo.
- **Icono Engrane (`Settings`)**: Configura el catálogo de **Estados** permitidos dentro de ese grupo específico.
- **Icono Papelera (`Trash`)**: Elimina el grupo y todas las tarjetas contenidas.
- **Botón Agregar Tarjeta**: Crea un nuevo ítem de ejecución al final de la columna.

### D. Tarjetas de Acción (DiagramNode)
Representan las unidades mínimas de ejecución o indicadores.
- **Etiqueta (Label)**: Nombre de la acción o KPI.
- **Descripción**: Detalle extendido de la tarea.
- **Fecha**: Fecha compromiso o hito.
- **Badge de Estado**: Selector circular que muestra el progreso (Pendiente, En Proceso, Bloqueado, etc.).
- **Responsable**: Usuario asignado (Identificado mediante `@nombre`).

---

## 3. FLUJOS OPERATIVOS PASO A PASO

### Configuración Inicial de un Grupo
1. Haga clic en **"Nuevo Grupo"** al final de la cuadrícula.
2. Defina un título claro (ej: "Fase 1: Diagnóstico").
3. Use el icono de **Configuración (`Settings`)** en el encabezado del grupo para definir los estados que desea medir (ej: "Por Iniciar", "Validando", "Finalizado").
4. Asigne un color distintivo para facilitar el seguimiento visual.

### Operaciones con IA (Roadmap Analysis)
1. Con los datos cargados en el tablero, haga clic en el icono **Roadmap IA (`TrendingUp`)** en la barra superior.
2. El sistema analizará la coherencia entre los grupos y tarjetas.
3. Se generará una propuesta estratégica de mejora basada en los datos actuales.

### Manejo de Excepciones y Errores
- **Error "Acceso Denegado"**: Ocurre si intenta editar una página donde solo tiene permisos de lectura. Contacte a su administrador de empresa.
- **Tarjetas que no persisten**: Asegúrese de que su conexión a internet esté activa; el sistema realiza autoguardado, pero requiere sincronización con Supabase.

---

## 4. REGLAS DE NEGOCIO Y VISIBILIDAD

El sistema opera bajo un modelo de RBAC (Control de Acceso Basado en Roles):

| Elemento | Superadmin | Company-Admin | Consultor (User) |
| :--- | :---: | :---: | :---: |
| Crear/Borrar Páginas | Sí | Sí | No |
| Editar Grupos/Tarjetas | Sí | Sí | Solo si tiene permiso |
| Configuración de Sistema | Sí | No | No |
| Ver Historial | Sí | Sí | Sí |
| Gestionar Usuarios | Sí | Sí | No |

> [!IMPORTANT]
> Los botones de edición (`Eliminar`, `Renombrar`, `Settings`) se ocultan automáticamente para los usuarios que no poseen el rol de escritura sobre el tablero activo.

---

## 5. MEJORES PRÁCTICAS (PRO-TIPS)
- **Orden Visual**: Utilice el Drag & Drop para priorizar las tarjetas más críticas en la parte superior de cada columna.
- **Estados por Columna**: No tema personalizar los estados por columna; un grupo de "Finanzas" puede necesitar estados distintos a uno de "Marketing".
- **Auditoría**: Antes de reuniones importantes, revise el **Historial de Cambios** para entender quién y cuándo modificó los elementos clave.

---

## 6. ALERTS & WARNINGS

> [!NOTE]
> Todos los cambios realizados en el título o descripción de la página se reflejan instantáneamente en la pestaña del navegador para facilitar la identificación de sesiones múltiples.

> [!TIP]
> Puede reordenar las columnas completas arrastrándolas desde el encabezado de color. Esto es ideal para reorganizar procesos lineales.

> [!WARNING]
> La eliminación de una página o grupo es **irreversible**. El sistema solicitará confirmación, asegúrese de haber respaldado la información si es necesario antes de proceder.

> [!CAUTION]
> El acceso al Panel Administrativo permite modificar roles de otros usuarios. Use esta facultad con discreción para evitar bloqueos accidentales a colaboradores.
