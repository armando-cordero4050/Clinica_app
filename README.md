# DentalFlow - Sistema de Gestión de Laboratorio Dental

Sistema web para la gestión de órdenes de laboratorio dental con Kanban, SLA tracking y formulario público para dentistas.

## Características Principales

### Para el Laboratorio
- **Panel Kanban**: Visualiza todas las órdenes en un tablero tipo kanban con estados configurables
- **Seguimiento SLA**: Monitorea el tiempo de entrega de cada orden con alertas de vencimiento
- **Multi-Tenant**: Gestiona múltiples clínicas dentales con aislamiento completo de datos
- **Sistema de Pagos**: Registra pagos, rastrea saldo pendiente y genera reportes financieros
- **Gestión de Staff**: Asigna roles específicos (Diseño, Fabricación, Control de Calidad, etc.)
- **Catálogo de Servicios**: Configura servicios con precios en GTQ y USD
- **Dashboard BI**: Estadísticas, gráficas y métricas en tiempo real
- **Multi-moneda**: Soporta Quetzales y Dólares

### Para Dentistas (Formulario Público)
- **Acceso sin login**: Los dentistas pueden enviar órdenes sin necesidad de crear cuenta
- **Selector de Clínica**: Selecciona tu clínica registrada o escribe el nombre manualmente
- **Odontograma Geométrico**: Selección visual de dientes usando notación FDI
- **Multi-servicio**: Puede solicitar diferentes servicios para diferentes dientes en una sola orden
- **Archivos Adjuntos**: Sube radiografías, fotos y archivos relevantes con drag & drop
- **Información completa**: Incluye datos del paciente, diagnóstico y notas clínicas

## Tecnologías

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI Components**: Lucide React (iconos)
- **Estado**: React Context API

## Estructura de la Aplicación

```
src/
├── lib/
│   └── supabase.ts          # Cliente de Supabase
├── modules/
│   ├── auth/                # Autenticación
│   │   ├── AuthContext.tsx
│   │   └── LoginPage.tsx
│   ├── lab/                 # Dashboard del laboratorio
│   │   └── Dashboard.tsx
│   ├── lab-orders/          # Gestión de órdenes
│   │   └── KanbanBoard.tsx
│   └── public/              # Formulario público
│       └── OrderForm.tsx
└── App.tsx
```

## Base de Datos

### Tablas Principales

- `laboratories`: Configuración del laboratorio
- `clinics`: Clínicas dentales registradas (multi-tenant)
- `profiles`: Usuarios del sistema (lab_admin, lab_staff, clinic_admin, clinic_staff)
- `lab_staff_roles`: Roles del personal (Diseño, Fabricación, etc.)
- `lab_staff`: Asignación de usuarios a roles
- `lab_services`: Catálogo de servicios
- `lab_orders`: Órdenes de trabajo
- `payments`: Pagos recibidos por orden
- `order_status_history`: Historial de cambios de estado
- `order_notes`: Notas internas por orden
- `order_attachments`: Archivos adjuntos
- `odontogram_selections`: Dientes seleccionados por orden

### Estados de Órdenes (Kanban)

1. **Recibido**: Orden recién creada
2. **En Diseño**: En proceso de diseño CAD/CAM
3. **En Fabricación**: Manufacturando la prótesis
4. **Control de Calidad**: Inspección final
5. **Listo para Entrega**: Esperando ser entregado
6. **Entregado**: Orden completada

## Configuración Inicial

### 1. Variables de Entorno

El archivo `.env` ya contiene las credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://obmpgtepotikmsazuygh.supabase.co
VITE_SUPABASE_ANON_KEY=[your-key]
```

### 2. Base de Datos

Las migraciones ya fueron aplicadas e incluyen:
- Todas las tablas con RLS habilitado
- Funciones para generar números de orden automáticos
- Triggers para seguimiento de SLA
- Datos iniciales (laboratorio + servicios + roles)

### 3. Crear Usuario Administrador

Ver: `docs/setup-admin-user.md`

### 4. Instalar y Ejecutar

```bash
npm install
npm run dev
```

## Rutas de la Aplicación

- `/` - Login del laboratorio / Dashboard (si está autenticado)
- `/order` - Formulario público para dentistas

## Datos Iniciales del Laboratorio

**Nombre**: DentalFlow Lab Guatemala
**País**: Guatemala (GT)
**Teléfono**: +502 5555-5555
**Moneda Principal**: GTQ (Quetzales)
**Monedas Permitidas**: GTQ, USD
**Tasa de Impuesto**: 12% (IVA)

### Servicios Incluidos

1. **Corona de Porcelana** - Q1,200.00 (5 días)
2. **Corona de Zirconio** - Q1,600.00 (6 días)
3. **Prótesis Removible Acrílica** - Q2,500.00 (8 días)
4. **Implante Dental (Fabricación)** - Q3,800.00 (10 días)
5. **Guarda Oclusal** - Q750.00 (3 días)

### Roles de Staff Configurados

1. Administrador Global
2. Jefe de Laboratorio
3. Diseño
4. Fabricación
5. Control de Calidad
6. Entrega/Venta

## Seguridad (RLS)

Todas las tablas tienen Row Level Security habilitado:

- Los usuarios solo pueden ver su propio perfil
- Los administradores pueden ver y gestionar todo
- El personal del laboratorio puede ver todas las órdenes
- El formulario público puede crear órdenes anónimamente
- Nadie puede eliminar datos históricos

## Próximas Funcionalidades (Según Guía Maestra)

Esta es la versión simplificada. La guía maestra incluye:

- Módulo de clínicas (multi-tenant completo)
- Sistema de presupuestos clínicos
- Facturación interna
- Integración con Odoo.sh
- Sistema de pagos
- BI y métricas avanzadas
- Historial clínico completo

## Soporte

Para consultas sobre la arquitectura completa, revisar:
- `docs/guia_maestra_dentalflow_v3.md`
- `docs/ui_kit_dentalflow.md`
