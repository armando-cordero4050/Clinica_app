# Vistas por Rol de Usuario

Este documento describe qué vista y funcionalidades debe tener cada tipo de usuario según su rol en el sistema DentalFlow.

## Roles del Sistema

El sistema cuenta con 5 roles diferentes:

1. **super_admin** - Super Administrador del Laboratorio
2. **lab_admin** - Administrador del Laboratorio
3. **lab_staff** - Personal del Laboratorio
4. **clinic_admin** - Administrador de Clínica
5. **clinic_staff** - Personal de Clínica

---

## Vista del Laboratorio (Dashboard)

Los usuarios con roles `super_admin`, `lab_admin`, y `lab_staff` acceden al Dashboard del Laboratorio.

### Super Admin (`super_admin`)

**Acceso completo al sistema**

#### Pestañas Disponibles:
- **Órdenes** - Gestión completa de órdenes en formato Kanban
- **Servicios** - Crear y gestionar servicios del laboratorio
- **Clínicas** - Administrar clínicas registradas
- **Pagos** - Ver reportes financieros y pagos
- **Personal** - Administrar usuarios del laboratorio
- **Estadísticas** - Dashboard con métricas y KPIs
- **Configuración** - Configuración global del laboratorio

#### Características de la Interfaz:
- Colores: Gradiente azul (blue-600 to cyan-600)
- Título: "DentalFlow - Lab Guatemala"
- Acceso a todas las funcionalidades

---

### Administrador del Laboratorio (`lab_admin`)

**Acceso administrativo completo**

#### Pestañas Disponibles:
- **Órdenes** - Gestión completa de órdenes en formato Kanban
- **Servicios** - Crear y gestionar servicios del laboratorio
- **Clínicas** - Administrar clínicas registradas
- **Pagos** - Ver reportes financieros y pagos
- **Personal** - Administrar usuarios del laboratorio
- **Estadísticas** - Dashboard con métricas y KPIs
- **Configuración** - Configuración global del laboratorio

#### Características de la Interfaz:
- Colores: Gradiente azul (blue-600 to cyan-600)
- Título: "DentalFlow - Lab Guatemala"
- Mismas funcionalidades que super_admin

---

### Personal del Laboratorio (`lab_staff`)

**Acceso limitado a gestión de órdenes**

#### Pestañas Disponibles:
- **Órdenes** - Gestión de órdenes en formato Kanban (puede cambiar estados, ver detalles, agregar notas)

#### Funcionalidades:
- Ver todas las órdenes del laboratorio
- Cambiar estados de las órdenes
- Ver detalles completos de cada orden
- Agregar notas y comentarios
- Ver archivos adjuntos
- NO puede: crear servicios, gestionar clínicas, ver pagos, administrar personal, ver estadísticas ni configuración

#### Características de la Interfaz:
- Colores: Gradiente azul (blue-600 to cyan-600)
- Título: "DentalFlow - Lab Guatemala"
- Solo muestra la pestaña de "Órdenes"

---

## Vista de Clínica (ClinicDashboard)

Los usuarios con roles `clinic_admin` y `clinic_staff` acceden al Dashboard de Clínica.

### Administrador de Clínica (`clinic_admin`)

**Gestión completa de su clínica**

#### Pestañas Disponibles:
- **Mis Órdenes** - Ver todas las órdenes de su clínica
- **Nueva Orden** - Crear nuevas órdenes al laboratorio
- **Pagos** - Ver el estado de pagos de su clínica

#### Funcionalidades:
- Ver y crear órdenes para su clínica
- Ver historial completo de órdenes
- Consultar estado de pagos y facturas
- Ver archivos y resultados de trabajos
- Comunicarse con el laboratorio mediante notas

#### Características de la Interfaz:
- Colores: Gradiente verde esmeralda (emerald-600 to teal-600)
- Título: "Portal de Clínica - DentalFlow Lab"
- Vista enfocada en su clínica únicamente

---

### Personal de Clínica (`clinic_staff`)

**Gestión operativa de órdenes**

#### Pestañas Disponibles:
- **Mis Órdenes** - Ver todas las órdenes de su clínica
- **Nueva Orden** - Crear nuevas órdenes al laboratorio

#### Funcionalidades:
- Ver órdenes de su clínica
- Crear nuevas órdenes
- Ver detalles y seguimiento de órdenes
- Ver archivos y resultados
- Agregar notas a las órdenes
- NO puede: ver pagos ni información financiera

#### Características de la Interfaz:
- Colores: Gradiente verde esmeralda (emerald-600 to teal-600)
- Título: "Portal de Clínica - DentalFlow Lab"
- Vista simplificada sin información financiera

---

## Diferencias Visuales Clave

### Dashboard del Laboratorio vs Dashboard de Clínica

| Aspecto | Laboratorio | Clínica |
|---------|-------------|---------|
| **Color Principal** | Azul/Cyan | Verde Esmeralda/Teal |
| **Título** | "DentalFlow - Lab Guatemala" | "Portal de Clínica - DentalFlow Lab" |
| **Alcance** | Todas las clínicas | Solo su clínica |
| **Funcionalidades** | Gestión completa del sistema | Gestión de órdenes propias |

### Resumen de Permisos

| Funcionalidad | super_admin | lab_admin | lab_staff | clinic_admin | clinic_staff |
|---------------|-------------|-----------|-----------|--------------|--------------|
| Ver todas las órdenes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver órdenes propias | N/A | N/A | N/A | ✅ | ✅ |
| Crear órdenes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestionar servicios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar clínicas | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver pagos del lab | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver pagos propios | N/A | N/A | N/A | ✅ | ❌ |
| Gestionar personal | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver estadísticas | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configuración | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Vista Pública (Sin Autenticación)

### Formulario de Orden Pública

Accesible en `/order` - Permite a cualquier persona crear una orden sin necesidad de registro.

#### Funcionalidades:
- Crear orden con datos del paciente
- Seleccionar servicios disponibles
- Proporcionar información de contacto
- No requiere autenticación

---

## Notas de Implementación Actual

### ¿Qué está implementado?

✅ Separación de rutas por rol (App.tsx)
✅ Control de pestañas según rol (availableTabs en cada Dashboard)
✅ Diferentes colores y títulos por tipo de usuario
✅ Filtrado de datos según el rol (RLS en base de datos)

### ¿Qué falta o necesita mejora?

❌ Las interfaces visuales son muy similares entre sí (necesitan más diferenciación)
❌ No hay suficiente personalización visual por rol
❌ Falta mensajes de bienvenida específicos por rol
❌ Podría mejorarse la experiencia de usuario con guías contextuales según el rol
❌ Falta dashboard específico para clinic_staff con información relevante

### Recomendaciones

1. **Personalizar más cada vista**: Cada tipo de usuario debería tener una experiencia visual única
2. **Agregar onboarding por rol**: Guías y tutoriales específicos según el rol
3. **Mejorar el dashboard inicial**: Mostrar información relevante inmediatamente según el rol
4. **Agregar notificaciones contextuales**: Alertas y recordatorios específicos por rol
5. **Crear widgets específicos**: Cada rol debería tener widgets y métricas relevantes a su función
