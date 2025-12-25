A continuación tienes la GUÍA MAESTRA INTEGRAL DEFINITIVA – DENTALFLOW / DENTALAPP (V3 FINAL).

## CONTROL DE CAMBIOS
- v3.0 – Arquitectura final aprobada (Diciembre 2025)
- Fuente única de verdad
- Cualquier cambio requiere PR y revisión arquitectónica


Este documento integra absolutamente todo lo que hemos acordado, sin contradicciones, listo para:

Implementar desde cero (Supabase + Odoo.sh)

Evitar retrabajos de base de datos

Guiar a tu agente de IA, a Copilot y a mí como auditor técnico

Escalar sin romper módulos

Mantener privacidad, BI y control financiero correctos

👉 Léelo como documento contractual técnico.
👉 Todo lo que no esté aquí no se implementa.

🏥 GUÍA MAESTRA INTEGRAL
DENTALFLOW / DENTALAPP – V3 FINAL (Cloud-First, Modular, Zero-Trust)

Ruta local: D:\DentalFlow
Repositorio: dentalapp (GitHub)
Frontend: React + Vite + Tailwind + shadcn/ui
Backend: Supabase Cloud
ERP: Odoo.sh (Laboratorio)
Estado: Arquitectura cerrada – lista para implementación

0️⃣ PRINCIPIOS FUNDAMENTALES (NO NEGOCIABLES)

Separación total de dominios

Clínica ↔ Paciente (interno, clínico, ficticio fiscal)

Laboratorio ↔ Clínica (real, financiero, Odoo)

Zero-Trust

El frontend nunca decide precios, permisos ni estados

Todo se valida en DB (RLS + funciones)

Multi-tenant estricto

Cada tabla de negocio tiene clinic_id

Laboratorios ven SOLO lo mínimo

Una orden de laboratorio = un producto

Varias órdenes pueden venir de una sola consulta

Nunca se agrupan para proceso ni estadísticas

Odoo NO es el sistema clínico

Odoo es ERP del laboratorio

La app es el sistema clínico y de operación

Idempotencia obligatoria

Ninguna integración externa puede duplicar datos

Módulos desacoplados

Si Odoo falla, la clínica sigue operando

Si BI falla, no afecta clínica ni lab

1️⃣ MODELO DE NEGOCIO DEFINITIVO
A. Clínica ↔ Paciente

La clínica es proveedor

El paciente es cliente

Precio lo define el doctor

Presupuesto clínico independiente

Factura/recibo interno (no fiscal por ahora)

Vive solo en la app

B. Laboratorio ↔ Clínica

El laboratorio es proveedor

La clínica es cliente

Precio lo define el laboratorio

Una orden = una venta + una factura en Odoo

Vive en Odoo + módulo lab de la app

📌 Nunca se mezclan precios, facturas ni monedas entre dominios

2️⃣ ROLES Y ALCANCE
Roles globales (aplicación)

super_admin_app

lab_admin_global

lab_staff

Roles por clínica

clinic_owner

clinic_dentist

clinic_reception

3️⃣ STACK TECNOLÓGICO FINAL
Frontend

React 18 + Vite + TypeScript

TailwindCSS

shadcn/ui + Radix UI

Framer Motion

TanStack Query

React Hook Form + Zod

Lucide Icons

Recharts

Sentry

Backend

Supabase Cloud

Postgres + RLS

Auth

Storage

Edge Functions

ERP

Odoo.sh

Módulos: Contacts, Sales, Accounting, Products

4️⃣ ARQUITECTURA MODULAR
dentalapp/
├─ docs/
├─ supabase/
│  ├─ migrations/
│  └─ functions/
├─ src/
│  ├─ app/
│  ├─ modules/
│  │  ├─ auth
│  │  ├─ acl
│  │  ├─ config
│  │  ├─ patients
│  │  ├─ odontogram
│  │  ├─ appointments
│  │  ├─ budgets
│  │  ├─ payments
│  │  ├─ invoices_internal
│  │  ├─ lab_orders
│  │  ├─ lab_catalog
│  │  ├─ integrations_odoo
│  │  ├─ bi_clinic
│  │  └─ superadmin
│  └─ shared/
└─ README.md

5️⃣ BASE DE DATOS – ESQUEMA DEFINITIVO
5.1 Clínicas

clinics

id

name

logo_url

phone

address

tax_nit

tax_regime

tax_rate (default 0.12)

default_currency (GTQ|USD)

allowed_currencies

created_at

5.2 Usuarios y Tenancy

profiles

id (auth)

full_name

email

global_role

active_clinic_id

clinic_members

clinic_id

user_id

role_template_id

status

5.3 Permisos (ABAC)

permissions
role_templates
role_permissions
staff_permissions
View: user_effective_permissions

5.4 Pacientes

patients

id

clinic_id

first_name

last_name

gender

birthdate

phone

email

medical_history

default_currency

patient_fiscal_profiles

5.5 Odontograma

patient_teeth_status
clinical_events

5.6 Agenda

appointments

5.7 Presupuestos clínicos

budgets

currency

exchange_rate

tax_rate

subtotal

total_tax

total_amount

balance

status

budget_items

payments

5.8 Facturación interna

invoices_internal
invoice_sequences

5.9 Laboratorios

laboratories
lab_products

price_gtq

price_usd

turnaround_days

manufacturing_template

5.10 Órdenes de laboratorio

lab_orders

lab_product_id

price (copiado del catálogo)

currency (del lab)

diagnosis

doctor_request

patient_age

patient_gender

odontogram_pdf_url

status

5.11 Integración Odoo

odoo_links

entity_type

supabase_id

odoo_model

odoo_id

integration_jobs
integration_logs

6️⃣ FUNCIONES, RPC Y TRIGGERS
Funciones core

current_clinic_id()

check_permission(slug, clinic_id)

RPC clínicas

update_tooth_status

close_budget

issue_internal_invoice

Triggers

Recalcular totales presupuesto

Validar pagos

Validar transición lab_order

7️⃣ INTEGRACIÓN ODOO (DEFINITIVA)
Flujo completo (Paso 1–4)
Paso 1 – Resolver cliente

Buscar res.partner.ref = clinics.id

Si no existe → crear automáticamente

Paso 2 – Crear venta

sale.order

client_order_ref = lab_orders.id

Paso 3 – Confirmar venta

action_confirm()

Paso 4 – Crear factura

account.move

Todo dentro de Edge Function idempotente.

8️⃣ MAPEO SUPABASE ↔ ODOO (RESUMEN)
Supabase	Odoo
clinics	res.partner
lab_products	product.template
lab_orders	sale.order
lab_orders	account.move
9️⃣ BI Y ESTADÍSTICAS
BI por clínica

Ingresos

Deuda

Conversión

Productividad doctor

Margen (precio paciente − costo lab)

BI laboratorio

Órdenes por estado

SLA breach

Carga por técnico

Ingresos por producto

BI super admin

Clínicas activas

Volumen global

Top laboratorios

SLA global

Uso de módulos

🔟 UI KIT DENTALFLOW (PREMIUM)
Componentes obligatorios

AppShell

Sidebar + Topbar

ClinicSwitcher

Command Palette

DataTable

Kanban

Timeline

KPI Cards

Money formatter

Skeletons

Empty states

Animaciones

Framer Motion en rutas, modales y kanban

1️⃣1️⃣ PROMPTS PARA IA
Prompt Maestro (Agente IDE)
ACT AS: Senior Principal Architect & Lead Full-Stack Engineer.
PROJECT: DentalApp (DentalFlow).
STACK: React+Vite+Tailwind+shadcn/ui+TanStackQuery+FramerMotion | Supabase Cloud (Postgres RLS ABAC + RPC + Edge Functions) | Odoo.sh (Lab ERP).
RULES:
- Clinic bills patient internally.
- Lab bills clinic via Odoo.
- One lab order = one product.
- Multi-currency GTQ/USD.
- Strict privacy: lab never sees patient data.
- Implement DB first, then RPC, then UI, then Edge Functions.

Prompt por módulo
Implement module {MODULE}.
Isolate logic.
Respect RLS and ABAC.
Never trust frontend for money or permissions.
Add loading, empty, error states.

Prompt QA
Audit repo for:
- Missing clinic_id
- Missing RLS
- Money logic in frontend
- Lab privacy leaks
- Odoo idempotency issues
Return fixes with file paths.

Prompt Copilot
Build DentalFlow SaaS. React+Vite+Tailwind+shadcn/ui. Supabase Cloud with RLS ABAC. Internal clinic billing. Odoo only for lab orders (sale.order + invoice). One lab order per product. Multi-currency. Modular architecture.

1️⃣2️⃣ ORDEN DE IMPLEMENTACIÓN (CHECKLIST)

Crear repo y estructura

Supabase: tablas + RLS

Funciones y triggers

UI shell + auth

Configuración clínica

Pacientes + odontograma

Presupuestos + pagos

Factura interna

Laboratorio + órdenes

Edge Function Odoo

BI clínica

BI super admin

✅ ESTADO FINAL

🔒 Arquitectura cerrada
🔁 Sin retrabajos futuros
📊 BI completo
🔐 Privacidad garantizada
🚀 Escalable