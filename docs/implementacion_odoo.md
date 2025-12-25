Aquí está el prompt completo para la integración con Odoo:


# INTEGRACIÓN COMPLETA CON ODOO ERP

## CONTEXTO
Tengo una aplicación de gestión de laboratorio dental construida con:
- Frontend: React + TypeScript + Vite
- Backend: Supabase (PostgreSQL + Auth + Edge Functions)
- Funcionalidades actuales:
  - Gestión multi-tenant de clínicas
  - Órdenes de trabajo con workflow (Kanban)
  - Sistema de pagos y facturación
  - Tracking de SLA por paso
  - Gestión de servicios y precios
  - Galería de archivos adjuntos

## OBJETIVO
Necesito integrar esta aplicación con Odoo ERP para sincronizar:
1. **Clientes (Clínicas)**: res.partner
2. **Productos (Servicios dentales)**: product.template
3. **Órdenes de venta**: sale.order
4. **Facturas**: account.move
5. **Pagos**: account.payment
6. **Inventario de materiales**: stock.move
7. **Tiempos de trabajo**: hr.timesheet

## REQUERIMIENTOS TÉCNICOS

### 1. Arquitectura de Integración
- **Modo**: Bidireccional en tiempo real
- **Autenticación**: Odoo XML-RPC o REST API
- **Sincronización**: 
  - Webhook de Odoo → Supabase Edge Functions
  - Trigger de Supabase → Odoo API
- **Manejo de errores**: Queue de retry con exponential backoff
- **Logs**: Tabla de auditoría de sincronización

### 2. Mapeo de Entidades

#### Clínicas → res.partner (Odoo)
clinics (Supabase)         →    res.partner (Odoo)

id (uuid)                  →    x_supabase_id (char)
name                       →    name
email                      →    email
phone                      →    phone
address                    →    street
city                       →    city
country                    →    country_id
tax_id                     →    vat
is_active                  →    active
payment_terms              →    property_payment_term_id
credit_limit               →    credit_limit



#### Servicios → product.template (Odoo)
services (Supabase)        →    product.template (Odoo)

id (uuid)                  →    x_supabase_id (char)
name                       →    name
description                →    description_sale
default_price_gtq          →    list_price (si currency=GTQ)
default_price_usd          →    list_price (si currency=USD)
category                   →    categ_id
estimated_days             →    sale_delay
is_active                  →    active
requires_materials         →    x_requires_materials (bool)



#### Órdenes → sale.order (Odoo)
lab_orders (Supabase)      →    sale.order (Odoo)

id (uuid)                  →    x_supabase_id (char)
order_number               →    name
clinic_id                  →    partner_id
service_name               →    order_line.product_id
price                      →    amount_total
status                     →    state (draft/sale/done)
created_at                 →    date_order
due_date                   →    commitment_date
patient_name               →    x_patient_name (char)
doctor_name                →    x_doctor_name (char)
notes                      →    note



#### Pagos → account.payment (Odoo)
payments (Supabase)        →    account.payment (Odoo)

id (uuid)                  →    x_supabase_id (char)
order_id                   →    communication (ref)
amount                     →    amount
payment_date               →    date
payment_method             →    journal_id
currency                   →    currency_id
status                     →    state
notes                      →    ref



### 3. Flujos de Sincronización

#### FLUJO 1: Nueva Orden en Supabase → Odoo
Usuario crea orden en la app
Trigger PG ejecuta función sync_to_odoo()
Edge Function procesa:
Valida datos
Busca/crea partner en Odoo
Busca producto en Odoo
Crea sale.order en Odoo
Actualiza order.odoo_id en Supabase
Si falla: guarda en queue_sync_retry


#### FLUJO 2: Cambio de Estado en Kanban → Odoo
Usuario mueve orden en Kanban
Trigger detecta cambio de status
Edge Function actualiza:
sale.order.state en Odoo
Crea hr.timesheet si es necesario
Actualiza stock si status = completed


#### FLUJO 3: Pago en Supabase → Factura en Odoo
Usuario registra pago
Edge Function:
Confirma sale.order (si draft)
Crea account.move (factura)
Registra account.payment
Concilia payment con invoice


#### FLUJO 4: Webhook de Odoo → Actualización en Supabase
Evento en Odoo (ej: pago registrado)
Webhook POST a Edge Function
Valida signature
Actualiza Supabase según entidad
Log en sync_audit_log


### 4. Estructura de Base de Datos (Supabase)

#### Nueva tabla: odoo_sync_config
```sql
CREATE TABLE odoo_sync_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid REFERENCES laboratories(id),
  odoo_url text NOT NULL,
  odoo_db text NOT NULL,
  odoo_username text NOT NULL,
  odoo_password_encrypted text NOT NULL,
  sync_enabled boolean DEFAULT true,
  sync_direction text DEFAULT 'bidirectional', -- 'to_odoo', 'from_odoo', 'bidirectional'
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now()
);
Nueva tabla: odoo_entity_mapping

CREATE TABLE odoo_entity_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_table text NOT NULL,
  supabase_id uuid NOT NULL,
  odoo_model text NOT NULL,
  odoo_id integer NOT NULL,
  sync_status text DEFAULT 'synced', -- 'synced', 'pending', 'error'
  last_synced_at timestamptz DEFAULT now(),
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(supabase_table, supabase_id)
);
Nueva tabla: sync_queue

CREATE TABLE sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL, -- 'create', 'update', 'delete'
  payload jsonb NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 5,
  next_retry_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);
Nueva tabla: sync_audit_log

CREATE TABLE sync_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL, -- 'to_odoo', 'from_odoo'
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  status text NOT NULL,
  request_payload jsonb,
  response_payload jsonb,
  error_details text,
  execution_time_ms integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sync_audit_log_created_at ON sync_audit_log(created_at DESC);
CREATE INDEX idx_sync_audit_log_entity ON sync_audit_log(entity_type, entity_id);
5. Edge Functions Necesarias
odoo-sync-order

// Sincroniza orden a Odoo
POST /functions/v1/odoo-sync-order
Body: { order_id: uuid }
odoo-sync-payment

// Sincroniza pago y genera factura en Odoo
POST /functions/v1/odoo-sync-payment
Body: { payment_id: uuid }
odoo-webhook-handler

// Recibe webhooks de Odoo
POST /functions/v1/odoo-webhook-handler
Body: { model: string, id: number, action: string, data: object }
odoo-sync-retry-processor

// Procesa queue de reintentos (cron cada 5 min)
// Invocado por pg_cron o servicio externo
6. Funcionalidades de UI Necesarias
Panel de Configuración Odoo (para lab_admin)

- URL de Odoo
- Base de datos
- Credenciales
- Test de conexión
- Habilitar/deshabilitar sync
- Dirección de sync (bi/uni)
- Mapeo de journals de pago
- Configuración de webhooks
Panel de Monitoreo de Sincronización

- Estado de sincronización en tiempo real
- Últimos 100 eventos
- Errores y reintentos
- Estadísticas (exitosos/fallidos)
- Botón de resincronización manual
- Logs detallados por entidad
Indicadores en UI Existente

- Badge en órdenes: "Sincronizado con Odoo"
- Ícono de error si sync falló
- Link directo a orden en Odoo
- Estado de facturación desde Odoo
7. Casos de Uso Especiales
Manejo de Conflictos
Si se edita en ambos lados: última modificación gana
Flag en UI si hay desincronización
Botón "Resolver conflicto" manual
Sincronización Inicial (Bulk)
Edge Function para importar datos existentes
Mapeo masivo de entidades
Progress bar en UI
Reporte de entidades no mapeadas
Odoo Multi-Company
Soporte para varios laboratorios con diferentes instancias
Configuración por lab_id
Validación de company_id en cada request
8. Seguridad
Credenciales encriptadas con Supabase Vault
Rate limiting en Edge Functions
Validación de webhook signatures (HMAC)
RLS policies para odoo_sync_config
IP whitelist opcional para webhooks
Logs de acceso a configuración
9. Plan de Implementación
FASE 1: Setup Inicial (Semana 1)
Crear tablas de configuración y mapeo
Implementar Edge Function de conexión Odoo (test)
UI de configuración básica
Test de autenticación XML-RPC
FASE 2: Sincronización de Clientes (Semana 2)
Trigger para nuevas clínicas
Mapeo bidireccional
Edge Function sync-clinic
Test de creación y actualización
FASE 3: Sincronización de Servicios (Semana 3)
Sincronizar productos desde Odoo
Actualizar precios automáticamente
Cache de productos en Supabase
FASE 4: Órdenes de Venta (Semana 4-5)
Trigger en lab_orders
Creación de sale.order
Actualización de estados
Tracking de workflow
FASE 5: Facturación y Pagos (Semana 6)
Generación automática de facturas
Registro de pagos
Conciliación automática
Reportes de pagos pendientes
FASE 6: Webhooks Inversos (Semana 7)
Configurar webhooks en Odoo
Edge Function handler
Actualización desde Odoo a Supabase
FASE 7: Inventario y Timesheet (Semana 8)
Consumo de materiales
Registro de horas trabajadas
Costeo por orden
FASE 8: UI de Monitoreo (Semana 9)
Panel de sincronización
Logs y auditoría
Resincronización manual
Alertas de errores
FASE 9: Testing y Optimización (Semana 10)
Testing end-to-end
Performance tuning
Documentación
Capacitación
ENTREGABLES ESPERADOS
Código:

Migraciones SQL completas
5 Edge Functions funcionales
Componentes React de configuración
Panel de monitoreo
Documentación:

Guía de instalación y configuración
Manual de mapeo de entidades
Troubleshooting común
Diagramas de flujo
Módulo Odoo (opcional):

Campos custom en modelos estándar
Webhooks automáticos
Vista de órdenes de laboratorio
CONSIDERACIONES IMPORTANTES
Performance: Usar queue para operaciones pesadas
Resiliencia: Sistema debe funcionar si Odoo está caído
Rollback: Capacidad de deshabilitar sync sin perder datos
Multi-moneda: Soportar GTQ y USD correctamente
Timezone: Manejar zonas horarias correctamente
Testing: Ambiente de staging antes de producción
PRIORIDADES
CRÍTICO: Órdenes y facturación (FASE 4-5)
ALTO: Clientes y productos (FASE 2-3)
MEDIO: Webhooks y monitoreo (FASE 6-8)
BAJO: Inventario y timesheet (FASE 7)
PROMPT DE EJECUCIÓN
"Implementa la integración completa entre mi aplicación de laboratorio dental (Supabase + React) y Odoo ERP siguiendo este documento.

Comienza con la FASE 1: crea las tablas de configuración, implementa la Edge Function de test de conexión a Odoo, y desarrolla el componente React para configurar las credenciales de Odoo.

Usa XML-RPC para la conexión a Odoo. Las credenciales deben encriptarse en Supabase Vault. Implementa RLS apropiado para que solo lab_admin pueda configurar la integración.

Por favor, procede implementando cada fase en orden, esperando mi confirmación antes de continuar con la siguiente fase."



Este prompt incluye todo el análisis técnico, arquitectura, mapeos, plan de implementación y consideraciones de seguridad para una integración completa con Odoo.
