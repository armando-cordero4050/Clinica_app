# Respuestas Técnicas Detalladas - DentalFlow

## 1. Edge Functions: Qué son y cómo usarlas

### ¿Qué son las Edge Functions?

Las **Edge Functions** son funciones serverless que corren en Deno (runtime de JavaScript/TypeScript) en la infraestructura de Supabase. Son como mini-servidores que se ejecutan solo cuando los necesitas.

**En tu aplicación actual tienes 4:**
1. `create-staff-user` - Crea usuarios de manera segura
2. `send-order-confirmation` - Envía email al dentista
3. `notify-lab-new-order` - Envía email al laboratorio
4. `notify-order-ready` - Notifica cuando orden está lista

### ¿Cómo funcionan?

```
Cliente (React) → HTTP Request → Edge Function → Supabase DB
                                      ↓
                                 Resend API (emails)
```

### ¿Puedo usarlas sin romper la app?

**SÍ, son completamente seguras** porque:
- ✅ Están aisladas del código principal
- ✅ Si fallan, la app sigue funcionando
- ✅ Tienen su propio código y dependencias
- ✅ Se ejecutan en servidores de Supabase, no en tu máquina

### Ejemplo: create-staff-user

**Ubicación:** `supabase/functions/create-staff-user/index.ts`

**Qué hace:**
```typescript
// Recibe petición HTTP con datos del usuario
POST /create-staff-user
{
  "email": "doctor@clinica.com",
  "password": "password123",
  "full_name": "Dr. Juan Pérez",
  "role": "clinic_admin",
  "clinic_id": "uuid-de-clinica"
}

// Ejecuta:
1. Verifica que quien llama sea admin
2. Crea usuario en Supabase Auth
3. Crea perfil en tabla profiles
4. Retorna éxito o error
```

**Cómo se llama desde React:**
```typescript
const response = await supabase.functions.invoke('create-staff-user', {
  body: { email, password, full_name, role, clinic_id }
});
```

---

## 2. Conexión a Supabase: Por qué bolt.new puede y yo necesito configuración

### ¿Por qué bolt.new ejecuta comandos automáticamente?

Bolt.new tiene **credenciales pre-configuradas** en su entorno. Es como si ya tuviera las llaves de tu casa.

### ¿Qué necesito para conectarme yo?

**Información requerida (ya la tienes en `.env`):**

```env
VITE_SUPABASE_URL=https://obmpgtepotikmsazuygh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Para operaciones de admin (migraciones, Edge Functions):**

```env
SUPABASE_ACCESS_TOKEN=sbp_xxx...
SUPABASE_DB_PASSWORD=tu-password-de-db
```

### ¿Dónde obtengo estas credenciales?

**1. SUPABASE_ACCESS_TOKEN:**
```
1. Ve a: https://supabase.com/dashboard/account/tokens
2. Clic en "Generate new token"
3. Copia el token
```

**2. SUPABASE_DB_PASSWORD:**
```
1. Ve a tu proyecto en Supabase
2. Settings → Database
3. Copia el password (o resetéalo si no lo recuerdas)
```

### Comandos que puedo ejecutar con Supabase CLI

**Instalar CLI:**
```bash
npm install -g supabase
```

**Login:**
```bash
supabase login
# Te pedirá el SUPABASE_ACCESS_TOKEN
```

**Vincular proyecto:**
```bash
cd d:\app-clinic\Clinica_app
supabase link --project-ref obmpgtepotikmsazuygh
# Te pedirá el DB password
```

**Ejecutar migraciones:**
```bash
supabase db push
```

**Desplegar Edge Functions:**
```bash
supabase functions deploy nombre-funcion
```

---

## 3. Integración con Odoo: Paso a paso completo

### ¿Qué es Odoo y por qué lo necesitamos?

**Odoo** es un ERP (sistema de gestión empresarial) que el **laboratorio** usa para:
- Gestionar ventas a clínicas (sale.order)
- Generar facturas (account.move)
- Llevar contabilidad
- Gestionar inventario

**IMPORTANTE:** Odoo es SOLO para el laboratorio, NO para las clínicas.

### Arquitectura de la integración

```
DentalFlow (Clínica) → Crea orden de lab → Supabase DB
                                              ↓
                                    Edge Function (sync-to-odoo)
                                              ↓
                                         Odoo.sh API
                                              ↓
                                    Crea: Cliente + Venta + Factura
```

### Paso 1: Configurar cuenta Odoo.sh

**1.1 Crear cuenta:**
```
1. Ve a: https://www.odoo.sh/
2. Clic en "Start now"
3. Crea cuenta (tiene plan gratuito de prueba)
4. Selecciona región (USA o Europa)
```

**1.2 Crear proyecto:**
```
1. Nombre: "DentalFlow Lab"
2. Selecciona módulos:
   - Sales
   - Accounting
   - Contacts
   - Products
```

**1.3 Obtener credenciales API:**
```
1. Settings → Users & Companies → Users
2. Selecciona tu usuario
3. Ve a "API Keys"
4. Genera nueva API Key
5. Guarda: URL, Database, Username, API Key
```

### Paso 2: Configurar campos personalizados en Odoo

**2.1 Agregar campo en res.partner (Clientes):**
```python
# En Odoo, ve a Settings → Technical → Database Structure → Models
# Busca: res.partner
# Agrega campo:
supabase_clinic_id = fields.Char(string='Supabase Clinic ID')
```

**2.2 Agregar campo en sale.order (Ventas):**
```python
supabase_order_id = fields.Char(string='Supabase Order ID')
```

### Paso 3: Crear productos en Odoo

**Manualmente en Odoo:**
```
1. Sales → Products → Create
2. Para cada servicio de DentalFlow:
   - Name: "Corona de Porcelana"
   - Internal Reference: "CORONA_PORCELANA"
   - Sales Price: 1200 GTQ
   - Cost: 800 GTQ (ejemplo)
   - Product Type: Service
```

### Paso 4: Crear Edge Function de sincronización

**Archivo:** `supabase/functions/sync-to-odoo/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ODOO_URL = Deno.env.get('ODOO_URL')!
const ODOO_DB = Deno.env.get('ODOO_DB')!
const ODOO_USERNAME = Deno.env.get('ODOO_USERNAME')!
const ODOO_API_KEY = Deno.env.get('ODOO_API_KEY')!

serve(async (req) => {
  try {
    const { order_id } = await req.json()
    
    // 1. Obtener orden de Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    const { data: order } = await supabase
      .from('lab_orders')
      .select('*, clinics(*)')
      .eq('id', order_id)
      .single()
    
    // 2. Buscar o crear cliente en Odoo
    const partnerId = await resolvePartner(order.clinic_id, order.clinics)
    
    // 3. Crear venta en Odoo
    const saleOrderId = await createSaleOrder(partnerId, order)
    
    // 4. Confirmar venta
    await confirmSaleOrder(saleOrderId)
    
    // 5. Crear factura
    const invoiceId = await createInvoice(saleOrderId)
    
    // 6. Guardar links en Supabase
    await supabase.from('odoo_links').insert([
      {
        entity_type: 'clinic',
        supabase_id: order.clinic_id,
        odoo_model: 'res.partner',
        odoo_id: partnerId
      },
      {
        entity_type: 'lab_order',
        supabase_id: order_id,
        odoo_model: 'sale.order',
        odoo_id: saleOrderId
      },
      {
        entity_type: 'lab_order',
        supabase_id: order_id,
        odoo_model: 'account.move',
        odoo_id: invoiceId
      }
    ])
    
    return new Response(JSON.stringify({ success: true }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
```

### Paso 5: Configurar variables de entorno

**En Supabase Dashboard:**
```
1. Project Settings → Edge Functions → Environment Variables
2. Agregar:
   ODOO_URL=https://tu-instancia.odoo.com
   ODOO_DB=tu-database
   ODOO_USERNAME=admin
   ODOO_API_KEY=tu-api-key
```

### Paso 6: Desplegar y probar

**Desplegar:**
```bash
supabase functions deploy sync-to-odoo
```

**Probar:**
```bash
curl -X POST \
  https://obmpgtepotikmsazuygh.supabase.co/functions/v1/sync-to-odoo \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "uuid-de-orden-real"}'
```

---

## 4. Sistema de Presupuestos: Implementación según finanzas.md

### Arquitectura del módulo de presupuestos

Según `finanzas.md`, el sistema debe manejar:

**Clínica → Paciente:**
- Presupuesto clínico (budgets)
- Items del presupuesto (budget_items)
- Pagos parciales/completos
- Conversión a factura interna

**NO involucra a Odoo** (es interno de la clínica)

### Tablas necesarias

**1. budgets:**
```sql
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  budget_number text NOT NULL UNIQUE,
  currency text NOT NULL CHECK (currency IN ('GTQ', 'USD')),
  exchange_rate numeric(10,4) DEFAULT 1.0,
  tax_rate numeric(5,4) DEFAULT 0.12,
  subtotal numeric(10,2) DEFAULT 0,
  total_tax numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  balance numeric(10,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'approved', 'rejected', 'converted', 'cancelled'
  )),
  valid_until date,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Implementación paso a paso SIN romper la app

**Paso 1: Crear migraciones**
```bash
# Crear archivo de migración
# supabase/migrations/20251226_add_budgets_system.sql
```

**Paso 2: Aplicar migración**
```bash
supabase db push
```

**Paso 3: Crear componentes (uno a la vez)**
```
1. BudgetList.tsx (solo lectura primero)
2. BudgetForm.tsx (crear presupuestos)
3. BudgetItemsTable.tsx (agregar items)
4. Integrar en Dashboard
```

**Paso 4: Probar en desarrollo**
```bash
npm run dev
# Probar cada funcionalidad antes de continuar
```

---

## 5. Monitoreo: Sentry, Analytics y Logs

### Estado actual: NO implementado

Tienes razón, estas herramientas NO están configuradas actualmente.

### Implementación de Sentry

**Paso 1: Crear cuenta**
```
1. Ve a: https://sentry.io
2. Crea cuenta gratuita
3. Crea proyecto "DentalFlow"
4. Copia el DSN
```

**Paso 2: Instalar SDK**
```bash
npm install @sentry/react @sentry/vite-plugin
```

**Paso 3: Configurar en main.tsx**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/xxx",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
});
```

---

## Resumen de Prioridades

### Corto plazo (1-2 semanas)
1. ✅ Configurar Sentry (2 horas)
2. ✅ Configurar Google Analytics (1 hora)
3. ⏳ Implementar presupuestos (1 semana)

### Mediano plazo (1 mes)
4. ⏳ Integración Odoo (2 semanas)
5. ⏳ Logs centralizados (3 días)
