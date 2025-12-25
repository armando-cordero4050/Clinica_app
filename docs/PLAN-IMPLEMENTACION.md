# Plan de Implementación - DentalFlow

## Estado Actual
✅ **Versión 1.0 - MVP Funcional**
- Base de datos completa con RLS
- Formulario público para dentistas con odontograma
- Panel Kanban para gestión de órdenes
- Sistema de autenticación

---

## FASE 2: Configuración desde UI (2-3 semanas)
**Objetivo**: Eliminar necesidad de SQL manual para operaciones comunes

### 2.1 CRUD de Servicios
**Prioridad**: ALTA | **Complejidad**: Media

**Tareas**:
1. Crear componente `ServiceList` (tabla con búsqueda y filtros)
2. Crear formulario `ServiceForm` (crear/editar)
3. Implementar validaciones (precios, días de entrega)
4. Agregar conversión automática GTQ ↔ USD
5. Permitir activar/desactivar servicios
6. Agregar categorías personalizadas

**Archivos nuevos**:
- `src/modules/lab/services/ServiceList.tsx`
- `src/modules/lab/services/ServiceForm.tsx`
- `src/modules/lab/services/hooks/useServices.ts`

**RPC necesarias**: Ninguna (usa RLS existente)

---

### 2.2 Gestión de Staff
**Prioridad**: ALTA | **Complejidad**: Media-Alta

**Tareas**:
1. Componente `StaffList` (lista de usuarios)
2. Formulario `InviteStaffForm` (crear usuario + perfil)
3. Asignación de roles específicos del laboratorio
4. Activar/desactivar usuarios
5. Cambio de rol (lab_staff ↔ lab_admin)

**Desafío**: Crear usuario requiere Admin API key de Supabase
**Solución**: Edge Function `create-staff-user`

**Archivos nuevos**:
- `src/modules/lab/staff/StaffList.tsx`
- `src/modules/lab/staff/InviteStaffForm.tsx`
- `supabase/functions/create-staff-user/index.ts`

---

### 2.3 Configuración del Laboratorio
**Prioridad**: MEDIA | **Complejidad**: Baja

**Tareas**:
1. Formulario de configuración general
2. Editar nombre, teléfono, dirección
3. Configurar moneda predeterminada
4. Ajustar tasa de impuestos
5. Subir logo (Supabase Storage)

**Archivos nuevos**:
- `src/modules/lab/settings/LaboratorySettings.tsx`
- `src/modules/lab/settings/LogoUpload.tsx`

---

### 2.4 Detalle de Orden
**Prioridad**: ALTA | **Complejidad**: Baja

**Tareas**:
1. Vista detallada de orden (modal o página)
2. Mostrar información completa del paciente
3. Mostrar odontograma seleccionado
4. Historial de estados con timestamps
5. Agregar notas internas por el staff
6. Asignar técnico responsable

**Archivos nuevos**:
- `src/modules/lab-orders/OrderDetail.tsx`
- `src/modules/lab-orders/OrderNotes.tsx`
- `src/modules/lab-orders/OrderHistory.tsx`

**Tabla nueva**:
```sql
CREATE TABLE order_notes (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES lab_orders(id),
  user_id uuid REFERENCES profiles(id),
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## FASE 3: Comunicaciones Básicas (1-2 semanas)
**Objetivo**: Notificaciones automáticas vía email

### 3.1 Email a Dentista (Confirmación)
**Prioridad**: ALTA | **Complejidad**: Media

**Tareas**:
1. Edge Function `send-order-confirmation`
2. Template de email con detalles de orden
3. Trigger automático al crear orden

**Proveedor recomendado**: Resend.com (gratis hasta 3000/mes)

**Archivos nuevos**:
- `supabase/functions/send-order-confirmation/index.ts`

---

### 3.2 Email al Laboratorio (Nueva Orden)
**Prioridad**: MEDIA | **Complejidad**: Baja

**Tareas**:
1. Notificar al email del laboratorio
2. Incluir resumen de la orden
3. Link directo al dashboard

---

### 3.3 Email Orden Lista
**Prioridad**: ALTA | **Complejidad**: Baja

**Tareas**:
1. Trigger cuando status = 'ready_delivery'
2. Email al doctor indicando que puede recoger
3. Incluir datos de contacto del laboratorio

---

## FASE 4: Business Intelligence (2-3 semanas)
**Objetivo**: Dashboard de métricas y reportes

### 4.1 Dashboard de Órdenes
**Prioridad**: ALTA | **Complejidad**: Media

**Métricas a implementar**:
1. **Órdenes por estado** (gráfica de barras)
2. **Tendencia semanal** (línea de tiempo)
3. **Tiempo promedio por estado**
4. **SLA compliance** (% entregadas a tiempo)
5. **Top 5 clínicas**
6. **Top 5 servicios**
7. **Ingresos del mes** (GTQ y USD)

**Librerías**: Recharts (ya en guía maestra)

**Archivos nuevos**:
- `src/modules/lab/stats/Dashboard.tsx`
- `src/modules/lab/stats/OrdersChart.tsx`
- `src/modules/lab/stats/SLAMetrics.tsx`
- `src/modules/lab/stats/RevenueChart.tsx`

**RPC necesarias**:
```sql
CREATE FUNCTION get_orders_by_status()
CREATE FUNCTION get_revenue_by_period()
CREATE FUNCTION get_sla_compliance()
CREATE FUNCTION get_average_time_by_status()
```

---

### 4.2 Reportes Exportables
**Prioridad**: MEDIA | **Complejidad**: Baja

**Tareas**:
1. Exportar órdenes a CSV
2. Reporte de ingresos (PDF)
3. Filtros por fecha, clínica, estado
4. Resumen ejecutivo mensual

**Librería**: `jspdf` y `jspdf-autotable` para PDF

---

## FASE 5: Gestión de Archivos (1 semana)
**Objetivo**: Adjuntar documentos a órdenes

### 5.1 Subida de Archivos
**Prioridad**: MEDIA | **Complejidad**: Media

**Tareas**:
1. Configurar bucket en Supabase Storage
2. Componente `FileUpload` para dentistas
3. Galería de archivos en detalle de orden
4. Tipos: imágenes, PDFs, STL
5. Límite de tamaño y validación

**Tabla nueva**:
```sql
CREATE TABLE order_attachments (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES lab_orders(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

---

### 5.2 Generación de PDF Odontograma
**Prioridad**: BAJA | **Complejidad**: Media

**Tareas**:
1. Renderizar odontograma seleccionado
2. Generar PDF automático
3. Almacenar en Storage
4. Link en detalle de orden

**Librería**: `html2canvas` + `jspdf`

---

## FASE 6: Multi-Tenant (3-4 semanas)
**Objetivo**: Soporte para múltiples clínicas con sus propios usuarios

### 6.1 Módulo de Clínicas
**Prioridad**: MEDIA | **Complejidad**: ALTA

**Tareas**:
1. Crear tabla `clinics` (ya está en guía)
2. Modificar `profiles` para incluir `clinic_id`
3. Sistema de registro de clínicas
4. Asignar usuarios a clínicas
5. RLS por `clinic_id` en todas las tablas de negocio

**IMPORTANTE**: Requiere refactoring significativo

---

### 6.2 Sistema de Permisos ABAC
**Prioridad**: MEDIA | **Complejidad**: ALTA

**Tareas**:
1. Implementar tablas de la guía maestra:
   - `permissions`
   - `role_templates`
   - `role_permissions`
   - `staff_permissions`
2. Vista `user_effective_permissions`
3. Función `check_permission(slug, clinic_id)`
4. Middleware de frontend para control de UI

---

## FASE 7: Presupuestos y Facturación (4-5 semanas)
**Objetivo**: Gestión financiera completa

### 7.1 Presupuestos Clínicos
**Prioridad**: BAJA | **Complejidad**: ALTA

**Nota**: Solo si implementas módulo de clínicas primero

**Tareas**:
1. Tabla `budgets` y `budget_items`
2. Formulario de presupuesto
3. Aprobación/rechazo
4. Conversión a orden

---

### 7.2 Registro de Pagos
**Prioridad**: MEDIA | **Complejidad**: Media

**Tareas**:
1. Tabla `payments`
2. Métodos de pago (efectivo, tarjeta, transferencia)
3. Asignar pago a orden
4. Balance y deuda

---

### 7.3 Facturación Interna
**Prioridad**: BAJA | **Complejidad**: ALTA

**Tareas**:
1. Tabla `invoices_internal`
2. Generación de factura
3. Secuencias automáticas
4. Impresión de factura (PDF)

---

## FASE 8: Integración Odoo (3-4 semanas)
**Objetivo**: Sincronización con ERP para B2B

### 8.1 Setup Odoo
**Prioridad**: BAJA | **Complejidad**: ALTA

**Pre-requisitos**:
- Cuenta Odoo.sh activa
- Módulos instalados: Sales, Accounting, Contacts

**Tareas**:
1. Crear campo custom en `res.partner`: `supabase_clinic_id`
2. Crear campo custom en `sale.order`: `supabase_order_id`
3. Obtener API keys de Odoo

---

### 8.2 Edge Function de Sincronización
**Prioridad**: BAJA | **Complejidad**: ALTA

**Archivos nuevos**:
- `supabase/functions/sync-to-odoo/index.ts`

**Flujo**:
1. Resolver/crear cliente (`res.partner`)
2. Crear venta (`sale.order`)
3. Confirmar venta
4. Crear factura (`account.move`)
5. Registrar en `odoo_links`

**Tablas nuevas**:
```sql
CREATE TABLE odoo_links (
  id uuid PRIMARY KEY,
  entity_type text,
  supabase_id uuid,
  odoo_model text,
  odoo_id integer,
  synced_at timestamptz DEFAULT now()
);

CREATE TABLE integration_logs (
  id uuid PRIMARY KEY,
  entity_type text,
  entity_id uuid,
  action text,
  status text,
  error_message text,
  created_at timestamptz DEFAULT now()
);
```

---

## FASE 9: Funcionalidades Avanzadas (Opcional)

### 9.1 Sistema de Citas
**Prioridad**: BAJA | **Complejidad**: ALTA

**Tareas**:
1. Tabla `appointments`
2. Calendario interactivo
3. Recordatorios automáticos
4. Integración con Google Calendar

---

### 9.2 Historial Clínico Completo
**Prioridad**: BAJA | **Complejidad**: MEDIA

**Tareas**:
1. Tabla `patient_teeth_status`
2. Tabla `clinical_events`
3. Timeline de tratamientos
4. Odontograma con historial

---

### 9.3 App Móvil
**Prioridad**: BAJA | **Complejidad**: MUY ALTA

**Tecnología sugerida**: React Native + Expo
**Usuarios**: Dentistas y técnicos

---

## RESUMEN DE PRIORIDADES

### 🔴 PRIORIDAD CRÍTICA (Hacer primero)
1. **Detalle de Orden** - Para ver información completa
2. **CRUD de Servicios** - Eliminar SQL manual
3. **Email Confirmación** - Profesionalismo
4. **Dashboard BI Básico** - Toma de decisiones

### 🟡 PRIORIDAD ALTA (Hacer pronto)
1. **Gestión de Staff** - Agregar usuarios sin SQL
2. **Email Orden Lista** - Comunicación con dentistas
3. **Archivos Adjuntos** - Radiografías y fotos

### 🟢 PRIORIDAD MEDIA (Cuando tengas tiempo)
1. **Configuración Lab desde UI**
2. **Reportes Exportables**
3. **Sistema de Pagos**

### 🔵 PRIORIDAD BAJA (Largo plazo)
1. **Multi-Tenant**
2. **Integración Odoo**
3. **App Móvil**

---

## ESTIMACIÓN TOTAL DE TIEMPO

**MVP Actual**: ✅ Completado
**Fase 2 (Config UI)**: 2-3 semanas
**Fase 3 (Emails)**: 1-2 semanas
**Fase 4 (BI)**: 2-3 semanas
**Fase 5 (Archivos)**: 1 semana

**TOTAL para aplicación completa funcional**: ~6-9 semanas

---

## RECOMENDACIÓN DE SECUENCIA

### Sprint 1 (Semana 1-2):
- Detalle de Orden con notas
- Email confirmación a dentista

### Sprint 2 (Semana 3-4):
- CRUD de Servicios
- Dashboard BI básico

### Sprint 3 (Semana 5-6):
- Gestión de Staff con Edge Function
- Email orden lista

### Sprint 4 (Semana 7-8):
- Archivos adjuntos
- Reportes exportables

### Sprint 5+ (Semana 9+):
- Multi-tenant (si es necesario)
- Integración Odoo (si es necesario)

---

## TECNOLOGÍAS ADICIONALES REQUERIDAS

### Nuevas Dependencias:
```json
{
  "recharts": "^2.10.0",           // Gráficas BI
  "react-hook-form": "^7.49.0",    // Formularios complejos
  "zod": "^3.22.0",                // Validaciones
  "@tanstack/react-query": "^5.0.0", // Cache y estado servidor
  "date-fns": "^3.0.0",            // Manejo de fechas
  "jspdf": "^2.5.0",               // PDFs
  "jspdf-autotable": "^3.8.0",    // Tablas en PDF
  "react-dropzone": "^14.2.0"      // Upload de archivos
}
```

### Servicios Externos:
- **Resend.com**: Emails transaccionales (gratis 3000/mes)
- **Odoo.sh**: ERP (si decides integrarlo)

---

## NOTAS IMPORTANTES

1. **No eliminar código existente**: Todo lo actual sigue funcionando
2. **Migrations incrementales**: Una migración por feature
3. **Tests**: Considera agregar tests cuando llegues a Fase 6+
4. **Deployment**: Recomiendo Vercel o Netlify
5. **Monitoreo**: Agrega Sentry en producción
6. **Backups**: Supabase hace backups automáticos

---

## ¿POR DÓNDE EMPEZAR?

**Si quieres algo rápido y visible**:
→ Empieza con **Dashboard BI** (gráficas impresionan)

**Si quieres mejorar UX**:
→ Empieza con **Detalle de Orden** + **Notas Internas**

**Si quieres profesionalizar**:
→ Empieza con **Emails** + **CRUD de Servicios**

**Si necesitas escalar**:
→ Empieza con **Multi-Tenant** (pero es complejo)

---

¿Quieres que implemente alguna de estas fases ahora?
