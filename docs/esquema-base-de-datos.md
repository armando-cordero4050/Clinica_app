# Esquema de Base de Datos - DentalFlow

## Resumen General

DentalFlow es un sistema de gestión de laboratorio dental multi-tenant que permite:
- Gestión de laboratorios dentales y sus servicios
- Sistema multi-tenant con soporte para múltiples clínicas
- Procesamiento de órdenes de trabajo con seguimiento de estado
- Sistema de pagos con múltiples métodos y monedas
- Gestión de archivos adjuntos (imágenes, PDFs, archivos STL)
- Sistema de notificaciones por email automatizado
- Control de acceso granular basado en roles (RLS)

**Base de datos:** PostgreSQL (Supabase)
**Extensiones:** uuid-ossp, http
**Almacenamiento:** Supabase Storage para archivos

---

## Tablas del Sistema

### 1. laboratories
Configuración del laboratorio dental.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| name | text | Nombre del laboratorio | NOT NULL |
| country | text | País del laboratorio | DEFAULT 'GT' |
| phone | text | Teléfono de contacto | - |
| address | text | Dirección física | - |
| tax_id | text | NIT o identificación fiscal | DEFAULT 'CF' |
| tax_rate | numeric(5,4) | Tasa de impuesto (IVA) | DEFAULT 0.12 |
| default_currency | text | Moneda por defecto | DEFAULT 'GTQ', CHECK ('GTQ', 'USD') |
| allowed_currencies | text[] | Monedas permitidas | DEFAULT ['GTQ', 'USD'] |
| logo_url | text | URL del logotipo | - |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |
| updated_at | timestamptz | Última actualización | DEFAULT now() |

**Índices:** PRIMARY KEY en id

---

### 2. profiles
Perfiles de usuarios del sistema (extendido de auth.users).

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único del usuario | PRIMARY KEY, REFERENCES auth.users ON DELETE CASCADE |
| full_name | text | Nombre completo | NOT NULL |
| email | text | Email del usuario | NOT NULL |
| global_role | text | Rol global en el sistema | DEFAULT 'lab_staff', CHECK (ver roles abajo) |
| clinic_id | uuid | Clínica a la que pertenece | REFERENCES clinics(id) |
| avatar_url | text | URL del avatar | - |
| active | boolean | Usuario activo | DEFAULT true |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |
| updated_at | timestamptz | Última actualización | DEFAULT now() |

**Roles permitidos:**
- `super_admin`: Administrador global del sistema
- `lab_admin`: Administrador del laboratorio
- `lab_staff`: Personal del laboratorio
- `clinic_admin`: Administrador de clínica
- `clinic_staff`: Personal de clínica

**Índices:**
- PRIMARY KEY en id
- idx_profiles_clinic_id en clinic_id

---

### 3. clinics
Clínicas dentales que utilizan los servicios del laboratorio.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name | text | Nombre de la clínica | NOT NULL |
| contact_name | text | Nombre del contacto principal | NOT NULL |
| email | text | Email de la clínica | UNIQUE, NOT NULL |
| phone | text | Teléfono | - |
| address | text | Dirección | - |
| city | text | Ciudad | - |
| country | text | País | DEFAULT 'Guatemala' |
| active | boolean | Clínica activa | DEFAULT true |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |
| updated_at | timestamptz | Última actualización | DEFAULT now() |

**Índices:**
- PRIMARY KEY en id
- idx_clinics_email en email
- idx_clinics_active en active

---

### 4. lab_staff_roles
Roles predefinidos para el personal del laboratorio.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| name | text | Nombre del rol | NOT NULL, UNIQUE |
| description | text | Descripción del rol | - |
| color | text | Color para UI (hex) | DEFAULT '#6B7280' |
| display_order | int | Orden de visualización | DEFAULT 0 |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |

**Roles iniciales:**
1. Administrador Global
2. Jefe de Laboratorio
3. Diseño (CAD/CAM)
4. Fabricación
5. Control de Calidad
6. Entrega/Venta

**Índices:** PRIMARY KEY en id, UNIQUE en name

---

### 5. lab_staff
Asignación de usuarios a roles en el laboratorio.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| laboratory_id | uuid | Laboratorio | NOT NULL, REFERENCES laboratories ON DELETE CASCADE |
| user_id | uuid | Usuario | NOT NULL, REFERENCES profiles ON DELETE CASCADE |
| role_id | uuid | Rol asignado | NOT NULL, REFERENCES lab_staff_roles ON DELETE RESTRICT |
| active | boolean | Asignación activa | DEFAULT true |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |
| updated_at | timestamptz | Última actualización | DEFAULT now() |

**Restricciones:** UNIQUE(laboratory_id, user_id, role_id)
**Índices:** PRIMARY KEY en id

---

### 6. lab_services
Catálogo de servicios que ofrece el laboratorio.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| laboratory_id | uuid | Laboratorio | NOT NULL, REFERENCES laboratories ON DELETE CASCADE |
| name | text | Nombre del servicio | NOT NULL |
| description | text | Descripción detallada | - |
| category | text | Categoría del servicio | - |
| price_gtq | numeric(10,2) | Precio en Quetzales | NOT NULL, DEFAULT 0 |
| price_usd | numeric(10,2) | Precio en Dólares | NOT NULL, DEFAULT 0 |
| turnaround_days | int | Días de entrega | NOT NULL, DEFAULT 5 |
| active | boolean | Servicio activo | DEFAULT true |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |
| updated_at | timestamptz | Última actualización | DEFAULT now() |

**Servicios iniciales:**
1. Corona de Porcelana - Q1,200.00 (5 días)
2. Corona de Zirconio - Q1,600.00 (6 días)
3. Prótesis Removible Acrílica - Q2,500.00 (8 días)
4. Implante Dental - Q3,800.00 (10 días)
5. Guarda Oclusal - Q750.00 (3 días)

**Índices:** PRIMARY KEY en id

---

### 7. lab_orders
Órdenes de trabajo del laboratorio.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| laboratory_id | uuid | Laboratorio | NOT NULL, REFERENCES laboratories ON DELETE CASCADE |
| clinic_id | uuid | Clínica que hace la orden | REFERENCES clinics(id) |
| order_number | text | Número de orden (auto) | NOT NULL, UNIQUE |
| clinic_name | text | Nombre de la clínica | NOT NULL |
| doctor_name | text | Nombre del doctor | NOT NULL |
| doctor_email | text | Email del doctor | NOT NULL |
| patient_name | text | Nombre del paciente | NOT NULL |
| patient_age | int | Edad del paciente | - |
| patient_gender | text | Género del paciente | CHECK ('M', 'F', 'Otro') |
| service_id | uuid | Servicio solicitado | NOT NULL, REFERENCES lab_services ON DELETE RESTRICT |
| service_name | text | Nombre del servicio | NOT NULL |
| price | numeric(10,2) | Precio acordado | NOT NULL |
| currency | text | Moneda | NOT NULL, CHECK ('GTQ', 'USD') |
| diagnosis | text | Diagnóstico dental | - |
| doctor_notes | text | Notas del doctor | - |
| status | text | Estado actual | NOT NULL, DEFAULT 'received' (ver estados) |
| paid_amount | numeric | Monto pagado | DEFAULT 0, CHECK >= 0 |
| payment_status | text | Estado de pago | DEFAULT 'pending' (ver estados) |
| payment_due_date | date | Fecha límite de pago | - |
| due_date | date | Fecha de entrega estimada | Auto-calculada |
| completed_at | timestamptz | Fecha de completado | Auto al estado 'delivered' |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |
| updated_at | timestamptz | Última actualización | DEFAULT now() |

**Estados de orden:**
- `received`: Orden recibida
- `in_design`: En diseño CAD/CAM
- `in_fabrication`: En fabricación
- `quality_control`: En control de calidad
- `ready_delivery`: Lista para entrega
- `delivered`: Entregada
- `cancelled`: Cancelada

**Estados de pago:**
- `pending`: Sin pagos
- `partial`: Pago parcial
- `paid`: Pagado completo
- `overdue`: Vencido

**Formato número de orden:** DF{YY}-{00001} (ejemplo: DF25-00001)

**Índices:**
- PRIMARY KEY en id
- UNIQUE en order_number
- idx_lab_orders_clinic_id en clinic_id
- idx_lab_orders_payment_status en payment_status
- idx_lab_orders_payment_due_date en payment_due_date

---

### 8. order_status_history
Historial de cambios de estado de las órdenes.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| order_id | uuid | Orden | NOT NULL, REFERENCES lab_orders ON DELETE CASCADE |
| status | text | Estado registrado | NOT NULL |
| changed_by | uuid | Usuario que realizó el cambio | REFERENCES profiles ON DELETE SET NULL |
| notes | text | Notas del cambio | - |
| created_at | timestamptz | Fecha del cambio | DEFAULT now() |

**Índices:** PRIMARY KEY en id

---

### 9. order_notes
Notas internas sobre las órdenes.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| order_id | uuid | Orden | NOT NULL, REFERENCES lab_orders ON DELETE CASCADE |
| user_id | uuid | Usuario que creó la nota | NOT NULL, REFERENCES profiles ON DELETE CASCADE |
| note | text | Contenido de la nota | NOT NULL |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |

**Índices:**
- PRIMARY KEY en id
- idx_order_notes_order_id en order_id
- idx_order_notes_created_at en created_at DESC

---

### 10. odontogram_selections
Selección de piezas dentales en odontograma.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| order_id | uuid | Orden | NOT NULL, REFERENCES lab_orders ON DELETE CASCADE |
| tooth_number | text | Número de diente | NOT NULL |
| tooth_notation | text | Sistema de notación | DEFAULT 'FDI' |
| condition_type | text | Tipo de condición | NOT NULL, CHECK (ver tipos) |
| notes | text | Notas adicionales | - |
| created_at | timestamptz | Fecha de creación | DEFAULT now() |

**Tipos de condición:**
- `caries`: Caries dental
- `restoration`: Restauración
- `crown`: Corona
- `implant`: Implante
- `prosthesis`: Prótesis
- `missing`: Pieza faltante
- `endodontics`: Endodoncia
- `orthodontics`: Ortodoncia
- `surgery`: Cirugía

**Índices:** PRIMARY KEY en id

---

### 11. order_attachments
Archivos adjuntos a las órdenes (imágenes, PDFs, STL).

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| order_id | uuid | Orden | NOT NULL, REFERENCES lab_orders ON DELETE CASCADE |
| file_name | text | Nombre del archivo | NOT NULL |
| file_path | text | Ruta en storage | NOT NULL |
| file_size | bigint | Tamaño en bytes | NOT NULL |
| file_type | text | Tipo MIME | NOT NULL |
| uploaded_by_email | text | Email del cargador (público) | - |
| uploaded_by_user | uuid | Usuario que cargó (autenticado) | REFERENCES profiles(id) |
| created_at | timestamptz | Fecha de carga | DEFAULT now() |

**Tipos de archivo permitidos:**
- image/jpeg, image/jpg, image/png, image/webp
- application/pdf
- model/stl, application/sla

**Límite de tamaño:** 10MB por archivo

**Índices:**
- PRIMARY KEY en id
- idx_order_attachments_order_id en order_id
- idx_order_attachments_created_at en created_at DESC

---

### 12. payments
Registro de pagos recibidos por órdenes.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| id | uuid | Identificador único | PRIMARY KEY, DEFAULT gen_random_uuid() |
| order_id | uuid | Orden | NOT NULL, REFERENCES lab_orders ON DELETE CASCADE |
| amount | numeric | Monto del pago | NOT NULL, CHECK > 0 |
| currency | text | Moneda | NOT NULL, CHECK ('GTQ', 'USD') |
| payment_method | text | Método de pago | NOT NULL, CHECK (ver métodos) |
| payment_date | date | Fecha del pago | NOT NULL, DEFAULT CURRENT_DATE |
| reference_number | text | Número de referencia | - |
| notes | text | Notas del pago | - |
| recorded_by | uuid | Usuario que registró | NOT NULL, REFERENCES profiles(id) |
| created_at | timestamptz | Fecha de registro | DEFAULT now() |

**Métodos de pago:**
- `cash`: Efectivo
- `card`: Tarjeta
- `transfer`: Transferencia bancaria
- `check`: Cheque

**Índices:**
- PRIMARY KEY en id
- idx_payments_order_id en order_id
- idx_payments_payment_date en payment_date
- idx_payments_payment_method en payment_method

---

## Funciones de Base de Datos

### 1. generate_order_number()
Genera el siguiente número de orden disponible en formato DF{YY}-{00001}.

**Retorna:** text
**Uso:** Trigger automático en INSERT de lab_orders

```sql
Formato: DF + año (2 dígitos) + guion + número secuencial (5 dígitos)
Ejemplo: DF25-00001, DF25-00002, etc.
```

---

### 2. calculate_due_date(service_uuid)
Calcula la fecha de entrega basada en los días de turnaround del servicio.

**Parámetros:** service_uuid (uuid)
**Retorna:** date
**Uso:** Trigger automático en INSERT de lab_orders

```sql
due_date = CURRENT_DATE + turnaround_days
```

---

### 3. get_user_role()
Obtiene el rol global del usuario actual sin activar RLS (evita recursión).

**Retorna:** text
**Seguridad:** SECURITY DEFINER
**Uso:** Políticas RLS para verificar permisos

---

### 4. update_updated_at()
Actualiza el campo updated_at con la fecha y hora actual.

**Retorna:** TRIGGER
**Uso:** Trigger en UPDATE de múltiples tablas

---

### 5. update_order_payment_status()
Recalcula el monto pagado y estado de pago de una orden.

**Retorna:** TRIGGER
**Uso:** Trigger en INSERT/UPDATE/DELETE de payments

**Lógica:**
- Suma todos los pagos en la moneda de la orden
- Actualiza paid_amount
- Calcula payment_status:
  - paid_amount = 0 → 'pending'
  - paid_amount >= price → 'paid'
  - paid_amount > 0 y < price → 'partial'

---

### 6. update_clinic_updated_at()
Actualiza el campo updated_at de clínicas.

**Retorna:** TRIGGER
**Uso:** Trigger en UPDATE de clinics

---

## Triggers

### Triggers en lab_orders

| Trigger | Evento | Función | Descripción |
|---------|--------|---------|-------------|
| set_order_defaults_trigger | BEFORE INSERT | set_order_defaults() | Asigna número de orden y fecha de entrega |
| track_status_change_trigger | BEFORE UPDATE | track_status_change() | Registra cambios de estado y marca completed_at |
| trigger_send_order_confirmation | AFTER INSERT | send_order_confirmation_email() | Envía confirmación al doctor |
| trigger_notify_lab_new_order | AFTER INSERT | notify_lab_new_order() | Notifica al laboratorio |
| trigger_notify_order_ready | AFTER UPDATE | notify_order_ready() | Notifica cuando está lista |

### Triggers en otras tablas

| Tabla | Trigger | Evento | Función |
|-------|---------|--------|---------|
| laboratories | update_laboratories_updated_at | BEFORE UPDATE | update_updated_at() |
| profiles | update_profiles_updated_at | BEFORE UPDATE | update_updated_at() |
| lab_staff | update_lab_staff_updated_at | BEFORE UPDATE | update_updated_at() |
| lab_services | update_lab_services_updated_at | BEFORE UPDATE | update_updated_at() |
| clinics | update_clinics_updated_at | BEFORE UPDATE | update_clinic_updated_at() |
| payments | update_payment_status_on_insert | AFTER INSERT | update_order_payment_status() |
| payments | update_payment_status_on_update | AFTER UPDATE | update_order_payment_status() |
| payments | update_payment_status_on_delete | AFTER DELETE | update_order_payment_status() |

---

## Sistema de Notificaciones por Email

El sistema utiliza Edge Functions para enviar notificaciones automáticas:

### 1. send-order-confirmation
**Trigger:** Cuando se crea una nueva orden
**Destinatario:** Doctor/Clínica
**Contenido:** Confirmación de orden recibida con detalles

### 2. notify-lab-new-order
**Trigger:** Cuando se crea una nueva orden
**Destinatario:** Laboratorio
**Contenido:** Notificación de nueva orden para procesar

### 3. notify-order-ready
**Trigger:** Cuando orden cambia a estado 'ready_delivery'
**Destinatario:** Doctor/Clínica
**Contenido:** Notificación de que la orden está lista

**Nota:** Las funciones utilizan la extensión `http` y llaman a Supabase Edge Functions mediante net.http_post().

---

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. A continuación, las políticas principales:

### laboratories
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | global_role IN ('super_admin', 'lab_admin') |
| UPDATE | authenticated | global_role IN ('super_admin', 'lab_admin') |

### profiles
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | id = auth.uid() OR es admin |
| UPDATE | authenticated | id = auth.uid() |

### clinics
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | Lab staff VE TODO / Clinic users solo su clínica |
| INSERT | authenticated | Solo lab_admin |
| UPDATE | authenticated | Lab admin TODO / Clinic admin solo su clínica |

### lab_staff_roles
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | Todos |
| INSERT/UPDATE/DELETE | authenticated | Solo admins |

### lab_staff
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | user_id = auth.uid() OR es admin |
| INSERT/UPDATE/DELETE | authenticated | Solo admins |

### lab_services
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | ALL | Servicios activos visibles para todos |
| INSERT/UPDATE/DELETE | authenticated | Solo admins |

### lab_orders
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | Lab staff VE TODO / Clinic users solo sus órdenes |
| INSERT | anon/authenticated | Público puede crear / Clinic users sus órdenes |
| UPDATE | authenticated | Solo lab staff |
| DELETE | authenticated | Solo lab_admin |

### order_status_history
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | Lab staff VE TODO / Clinic users solo sus órdenes |
| INSERT | authenticated | Staff autenticado |

### order_notes
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | Lab staff VE TODO / Clinic users solo sus órdenes |
| INSERT | authenticated | user_id = auth.uid() |
| UPDATE/DELETE | authenticated | Solo el creador |

### odontogram_selections
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | Lab staff VE TODO / Clinic users solo sus órdenes |
| INSERT | anon/authenticated | Público / Clinic users sus órdenes / Lab staff |

### order_attachments
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | Lab staff VE TODO / Clinic users solo sus órdenes |
| INSERT | ALL | Todos pueden cargar archivos |
| DELETE | authenticated | Solo lab staff |

### payments
| Operación | Rol | Condición |
|-----------|-----|-----------|
| SELECT | authenticated | Lab staff VE TODO / Clinic users solo sus pagos |
| INSERT | authenticated | Solo lab staff |
| UPDATE/DELETE | authenticated | Solo lab_admin |

---

## Storage Buckets

### order-files
**Propósito:** Almacenar archivos adjuntos de órdenes
**Acceso:** Público (lectura)
**Límite:** 10MB por archivo
**MIME Types permitidos:**
- image/jpeg, image/jpg, image/png, image/webp
- application/pdf
- model/stl, application/sla

**Políticas:**
- Público puede cargar y leer
- Lab staff puede eliminar

---

## Relaciones entre Tablas

### Diagrama de Relaciones Principales

```
laboratories (1) ────┬──── (N) lab_staff
                     ├──── (N) lab_services
                     └──── (N) lab_orders

clinics (1) ─────────┬──── (N) profiles
                     └──── (N) lab_orders

profiles (1) ────────┬──── (N) lab_staff
                     ├──── (N) order_notes
                     └──── (N) payments

lab_staff_roles (1) ─┴──── (N) lab_staff

lab_services (1) ────┴──── (N) lab_orders

lab_orders (1) ──────┬──── (N) order_status_history
                     ├──── (N) order_notes
                     ├──── (N) odontogram_selections
                     ├──── (N) order_attachments
                     └──── (N) payments
```

### Claves Foráneas

| Tabla | Campo | Referencia | On Delete |
|-------|-------|------------|-----------|
| profiles | id | auth.users(id) | CASCADE |
| profiles | clinic_id | clinics(id) | - |
| lab_staff | laboratory_id | laboratories(id) | CASCADE |
| lab_staff | user_id | profiles(id) | CASCADE |
| lab_staff | role_id | lab_staff_roles(id) | RESTRICT |
| lab_services | laboratory_id | laboratories(id) | CASCADE |
| lab_orders | laboratory_id | laboratories(id) | CASCADE |
| lab_orders | clinic_id | clinics(id) | - |
| lab_orders | service_id | lab_services(id) | RESTRICT |
| order_status_history | order_id | lab_orders(id) | CASCADE |
| order_status_history | changed_by | profiles(id) | SET NULL |
| order_notes | order_id | lab_orders(id) | CASCADE |
| order_notes | user_id | profiles(id) | CASCADE |
| odontogram_selections | order_id | lab_orders(id) | CASCADE |
| order_attachments | order_id | lab_orders(id) | CASCADE |
| order_attachments | uploaded_by_user | profiles(id) | - |
| payments | order_id | lab_orders(id) | CASCADE |
| payments | recorded_by | profiles(id) | - |

---

## Lógica de Negocio

### 1. Flujo de Creación de Orden

1. **Formulario público/clínica crea orden** → INSERT en lab_orders
2. **Trigger set_order_defaults_trigger** → Asigna order_number y due_date
3. **Trigger track_status_change_trigger** → Registra estado inicial en order_status_history
4. **Trigger send_order_confirmation** → Envía email a doctor
5. **Trigger notify_lab_new_order** → Notifica al laboratorio
6. **Si hay archivos** → Se suben a storage bucket 'order-files' y se registran en order_attachments
7. **Si hay selección de dientes** → Se registran en odontogram_selections

### 2. Flujo de Cambio de Estado

1. **Usuario actualiza estado** → UPDATE lab_orders SET status = 'nuevo_estado'
2. **Trigger track_status_change_trigger** → INSERT en order_status_history
3. **Si status = 'delivered'** → Marca completed_at = now()
4. **Si status = 'ready_delivery'** → Trigger notify_order_ready envía email

### 3. Flujo de Pagos

1. **Lab staff registra pago** → INSERT en payments
2. **Trigger update_payment_status_on_insert** → Ejecuta update_order_payment_status()
3. **Función suma pagos** → Calcula total_paid en moneda de la orden
4. **Actualiza orden:**
   - paid_amount = total_paid
   - payment_status = 'pending' | 'partial' | 'paid'

### 4. Sistema Multi-Tenant

**Separación por clinic_id:**
- Cada orden pertenece a una clínica (clinic_id)
- Usuarios de clínica solo ven datos de su clínica (RLS)
- Lab staff ve TODO (sin filtro de clinic_id)

**Roles:**
- Lab: super_admin, lab_admin, lab_staff
- Clinic: clinic_admin, clinic_staff

### 5. Cálculo Automático

**Número de orden:**
- Formato: DF{YY}-{NNNNN}
- Auto-generado en creación
- Secuencial por año

**Fecha de entrega:**
- due_date = created_at + service.turnaround_days

**Estado de pago:**
- pending: paid_amount = 0
- partial: 0 < paid_amount < price
- paid: paid_amount >= price

---

## Índices para Optimización

Los siguientes índices mejoran el rendimiento de consultas frecuentes:

### Índices de búsqueda
- `idx_clinics_email` en clinics(email)
- `idx_clinics_active` en clinics(active)
- `idx_profiles_clinic_id` en profiles(clinic_id)

### Índices de relaciones
- `idx_order_notes_order_id` en order_notes(order_id)
- `idx_order_attachments_order_id` en order_attachments(order_id)
- `idx_payments_order_id` en payments(order_id)
- `idx_lab_orders_clinic_id` en lab_orders(clinic_id)

### Índices de ordenamiento
- `idx_order_notes_created_at` en order_notes(created_at DESC)
- `idx_order_attachments_created_at` en order_attachments(created_at DESC)
- `idx_payments_payment_date` en payments(payment_date)

### Índices de filtrado
- `idx_lab_orders_payment_status` en lab_orders(payment_status)
- `idx_lab_orders_payment_due_date` en lab_orders(payment_due_date)
- `idx_payments_payment_method` en payments(payment_method)

---

## Extensiones de PostgreSQL

### uuid-ossp
Generación de UUIDs v4 para identificadores únicos.

**Funciones utilizadas:**
- `uuid_generate_v4()` - Genera UUID versión 4
- `gen_random_uuid()` - Genera UUID aleatorio (nativo en Postgres 13+)

### http
Permite realizar peticiones HTTP desde funciones de base de datos.

**Uso:**
- Llamadas a Supabase Edge Functions para envío de emails
- `net.http_post()` - Realizar peticiones POST

---

## Configuración de Seguridad

### Principios de Seguridad Implementados

1. **Row Level Security (RLS)** habilitado en todas las tablas
2. **Separation of Concerns** - Lab staff vs Clinic users
3. **Data Isolation** - Multi-tenant por clinic_id
4. **Least Privilege** - Permisos mínimos necesarios
5. **Audit Trail** - order_status_history registra todos los cambios
6. **Secure Functions** - SECURITY DEFINER para evitar recursión RLS
7. **Cascade Deletes** - Limpieza automática de datos relacionados
8. **Foreign Key Constraints** - Integridad referencial

### Funciones de Seguridad

- `get_user_role()` - SECURITY DEFINER para consultas sin RLS
- Triggers que validan auth.uid() antes de insertar
- Storage policies que validan roles antes de eliminar

---

## Datos Iniciales (Seed Data)

### Laboratory
- **Nombre:** DentalFlow Lab Guatemala
- **País:** Guatemala (GT)
- **Moneda:** GTQ (USD permitido)
- **Tax Rate:** 12% (IVA)

### Lab Staff Roles (6 roles)
1. Administrador Global (#8B5CF6)
2. Jefe de Laboratorio (#3B82F6)
3. Diseño (#10B981)
4. Fabricación (#F59E0B)
5. Control de Calidad (#EF4444)
6. Entrega/Venta (#06B6D4)

### Lab Services (5 servicios)
1. Corona de Porcelana - Q1,200 / $154 (5 días)
2. Corona de Zirconio - Q1,600 / $205 (6 días)
3. Prótesis Removible Acrílica - Q2,500 / $321 (8 días)
4. Implante Dental - Q3,800 / $487 (10 días)
5. Guarda Oclusal - Q750 / $96 (3 días)

---

## Notas de Mantenimiento

### Actualizaciones Automáticas
Los campos `updated_at` se actualizan automáticamente en:
- laboratories
- profiles
- lab_staff
- lab_services
- lab_orders
- clinics

### Eliminación en Cascada
Al eliminar registros, se eliminan automáticamente:
- Eliminar laboratory → elimina lab_staff, lab_services, lab_orders
- Eliminar clinic → NO elimina nada (solo desactiva)
- Eliminar profile → elimina lab_staff
- Eliminar lab_order → elimina order_status_history, order_notes, odontogram_selections, order_attachments, payments

### Restricciones de Eliminación
- No se puede eliminar lab_staff_role si tiene asignaciones (RESTRICT)
- No se puede eliminar lab_service si tiene órdenes (RESTRICT)

---

## Consultas Útiles

### Ver órdenes con pago pendiente
```sql
SELECT * FROM lab_orders
WHERE payment_status IN ('pending', 'partial')
ORDER BY payment_due_date;
```

### Ver historial completo de una orden
```sql
SELECT * FROM order_status_history
WHERE order_id = '<uuid>'
ORDER BY created_at;
```

### Calcular ingresos del mes
```sql
SELECT
  currency,
  SUM(amount) as total_received,
  COUNT(*) as payment_count
FROM payments
WHERE payment_date >= date_trunc('month', CURRENT_DATE)
GROUP BY currency;
```

### Ver órdenes por clínica
```sql
SELECT
  c.name as clinic_name,
  COUNT(lo.id) as order_count,
  SUM(lo.price) as total_value
FROM clinics c
LEFT JOIN lab_orders lo ON lo.clinic_id = c.id
GROUP BY c.id, c.name
ORDER BY order_count DESC;
```

---

**Última actualización:** 2025-12-25
**Versión del esquema:** 1.0
**Total de tablas:** 12
**Total de funciones:** 6
**Total de triggers:** 14
