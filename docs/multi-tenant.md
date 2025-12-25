# Sistema Multi-Tenant - DentalFlow

## Descripción General

El sistema multi-tenant permite que múltiples clínicas dentales utilicen el laboratorio de manera independiente, con completa separación de datos y usuarios. Cada clínica tiene su propio espacio de trabajo y solo puede ver sus propias órdenes y datos.

## Arquitectura

### Tabla Clinics

Almacena información de las clínicas dentales registradas:

```sql
CREATE TABLE clinics (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  city text,
  country text DEFAULT 'Guatemala',
  active boolean DEFAULT true,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Modificaciones a Tablas Existentes

**profiles**: Agregado campo `clinic_id`
- Permite asociar usuarios con clínicas específicas
- Los usuarios de laboratorio tienen `clinic_id = NULL`
- Los usuarios de clínica tienen su `clinic_id` correspondiente

**lab_orders**: Agregado campo `clinic_id`
- Asocia cada orden con una clínica específica
- Las órdenes del formulario público pueden tener `clinic_id = NULL` si la clínica no está registrada

## Roles de Usuario

### Roles de Laboratorio
- **lab_admin**: Administrador del laboratorio, puede gestionar todo
- **lab_staff**: Personal del laboratorio, puede gestionar órdenes

### Roles de Clínica (Nuevos)
- **clinic_admin**: Administrador de la clínica, puede gestionar su clínica y crear órdenes
- **clinic_staff**: Personal de la clínica, puede crear órdenes

## Seguridad (RLS)

### Políticas de la Tabla `clinics`

1. **Lectura**:
   - Lab staff puede ver todas las clínicas
   - Usuarios de clínica solo ven su propia clínica

2. **Escritura**:
   - Solo lab_admin puede crear clínicas
   - Lab_admin y clinic_admin pueden actualizar clínicas (clinic_admin solo la suya)

### Políticas de la Tabla `lab_orders`

1. **Lectura**:
   - Lab staff puede ver todas las órdenes
   - Usuarios de clínica solo ven órdenes de su clínica

2. **Escritura**:
   - Lab staff puede actualizar cualquier orden
   - Usuarios de clínica pueden crear órdenes para su clínica
   - Solo lab_admin puede eliminar órdenes

### Políticas de Tablas Relacionadas

Las siguientes tablas heredan el filtrado automático basado en `lab_orders.clinic_id`:
- `odontogram_selections`
- `order_notes`
- `order_attachments`
- `order_status_history`

Los usuarios de clínica solo pueden acceder a datos relacionados con las órdenes de su clínica.

## Funcionalidades Implementadas

### 1. Panel de Gestión de Clínicas

**Ubicación**: Dashboard → Pestaña "Clínicas"

**Funcionalidades**:
- Listar todas las clínicas registradas
- Crear nuevas clínicas
- Editar información de clínicas existentes
- Activar/desactivar clínicas
- Eliminar clínicas (si no tienen órdenes asociadas)

**Campos de la clínica**:
- Nombre de la clínica
- Nombre de contacto
- Email (único)
- Teléfono
- Dirección
- Ciudad
- País
- Estado (activa/inactiva)

### 2. Selector de Clínica en Formulario Público

**Ubicación**: Formulario público de orden

**Funcionalidades**:
- Muestra un dropdown con clínicas activas registradas
- Permite seleccionar una clínica existente
- Si se selecciona una clínica, el nombre se rellena automáticamente
- Si la clínica no existe, se puede escribir el nombre manualmente
- Las órdenes se asocian automáticamente con la clínica seleccionada

### 3. Filtrado Automático por Clínica

**Implementación**: Políticas RLS en base de datos

**Comportamiento**:
- Lab staff: Ve todas las órdenes de todas las clínicas
- Usuarios de clínica: Solo ven órdenes de su propia clínica
- El filtrado es transparente, no requiere cambios en el código de la aplicación

## Flujos de Uso

### Flujo para Laboratorio

1. **Registrar nueva clínica**:
   - Lab admin accede a Dashboard → Clínicas
   - Hace clic en "Nueva Clínica"
   - Completa el formulario con datos de la clínica
   - Guarda la clínica

2. **Gestionar clínicas existentes**:
   - Ver lista de todas las clínicas
   - Editar información de cualquier clínica
   - Activar/desactivar clínicas
   - Eliminar clínicas sin órdenes

3. **Ver órdenes**:
   - Lab staff ve todas las órdenes de todas las clínicas
   - Puede filtrar o buscar por clínica si es necesario

### Flujo para Dentistas (Formulario Público)

1. **Crear orden con clínica registrada**:
   - Accede al formulario público
   - Selecciona su clínica del dropdown
   - El nombre de la clínica se rellena automáticamente
   - Completa el resto del formulario
   - La orden queda asociada a la clínica

2. **Crear orden sin clínica registrada**:
   - Accede al formulario público
   - No encuentra su clínica en el dropdown
   - Escribe manualmente el nombre de la clínica
   - Completa el resto del formulario
   - La orden se crea con `clinic_id = NULL`
   - El laboratorio puede asociar la orden a una clínica posteriormente

### Flujo para Usuarios de Clínica (Futuro)

En futuras versiones, las clínicas podrán tener sus propios usuarios:

1. **Login como usuario de clínica**
2. **Ver solo órdenes de su clínica**
3. **Crear nuevas órdenes desde el dashboard**
4. **Ver estadísticas de su clínica únicamente**

## Aislamiento de Datos

### Garantías de Seguridad

1. **Separación a nivel de base de datos**: Las políticas RLS garantizan que los datos están separados incluso si hay un bug en el código de la aplicación

2. **Validación automática**: Supabase valida automáticamente que cada usuario solo acceda a sus datos permitidos

3. **Sin filtrado manual**: El código de la aplicación no necesita filtrar datos por `clinic_id`, esto se hace automáticamente

### Qué Datos Están Aislados

- Órdenes de laboratorio
- Selecciones de odontograma
- Notas de órdenes
- Archivos adjuntos
- Historial de cambios de estado

### Qué Datos Son Compartidos

- Servicios del laboratorio (visibles para todos)
- Información del laboratorio (visible para todos)

## Consideraciones Técnicas

### Migraciones de Base de Datos

Se crearon 3 migraciones para implementar multi-tenant:

1. **add_multi_tenant_clinics**: Crea tabla `clinics` y agrega campos a tablas existentes
2. **update_rls_multi_tenant_related_tables**: Actualiza políticas RLS de tablas relacionadas
3. **add_clinic_roles_to_profiles**: Agrega nuevos roles de clínica

### Integridad Referencial

- `profiles.clinic_id` → `clinics.id` (nullable)
- `lab_orders.clinic_id` → `clinics.id` (nullable)
- Las clínicas no se pueden eliminar si tienen órdenes asociadas

### Índices de Rendimiento

Se crearon índices para optimizar consultas:
- `idx_clinics_email` en `clinics(email)`
- `idx_clinics_active` en `clinics(active)`
- `idx_profiles_clinic_id` en `profiles(clinic_id)`
- `idx_lab_orders_clinic_id` en `lab_orders(clinic_id)`

## Limitaciones Actuales

1. **Sin auto-registro**: Las clínicas deben ser registradas manualmente por el lab_admin
2. **Sin usuarios de clínica**: Aún no se pueden crear usuarios para las clínicas desde la UI
3. **Sin dashboard por clínica**: Las estadísticas no están filtradas por clínica
4. **Sin facturación por clínica**: No hay reportes financieros separados por clínica

## Próximos Pasos (No Implementado)

### Gestión de Staff de Clínica

1. Panel para que clinic_admin invite usuarios
2. Asignar roles (clinic_admin, clinic_staff)
3. Gestionar permisos de usuarios

### Dashboard por Clínica

1. Estadísticas filtradas por clínica
2. Reportes de órdenes de la clínica
3. Historial de servicios utilizados

### Facturación por Clínica

1. Resumen de órdenes por período
2. Total facturado a cada clínica
3. Estado de pagos por clínica

### Sistema de Permisos Avanzado (ABAC)

1. Permisos granulares por acción
2. Roles personalizables
3. Herencia de permisos
4. Auditoría de accesos

## Solución de Problemas

### Usuario no ve ninguna orden

**Causa**: El usuario tiene `clinic_id` asignado pero no hay órdenes para esa clínica
**Solución**: Verificar que las órdenes tengan el `clinic_id` correcto asignado

### Error al crear orden desde formulario público

**Causa**: La tabla `clinics` no tiene registros o todas están inactivas
**Solución**: El formulario permite escribir el nombre manualmente si no hay clínicas disponibles

### Lab admin no puede editar clínica

**Causa**: Políticas RLS no configuradas correctamente
**Solución**: Verificar que el usuario tenga rol `lab_admin` en la tabla `profiles`

### No se puede eliminar clínica

**Causa**: La clínica tiene órdenes asociadas
**Solución**: Cambiar el `clinic_id` de las órdenes a otra clínica o eliminar las órdenes primero

## Referencias

- **Migraciones**: Ver carpeta `supabase/migrations/`
- **Componente de gestión**: `src/modules/lab/clinics/ClinicsList.tsx`
- **Formulario público**: `src/modules/public/OrderForm.tsx`
- **Dashboard**: `src/modules/lab/Dashboard.tsx`
