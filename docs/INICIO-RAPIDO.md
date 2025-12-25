# Inicio Rápido - DentalFlow

## ¿Qué se ha creado?

Se ha implementado una aplicación web completa para gestión de laboratorio dental con:

1. **Base de datos** configurada en Supabase con todos los datos iniciales
2. **Formulario público** para que dentistas envíen órdenes (sin login)
3. **Panel Kanban** para gestionar el flujo de trabajo del laboratorio
4. **Odontograma geométrico** con notación FDI
5. **Sistema de autenticación** para el personal del laboratorio
6. **Seguimiento SLA** con alertas de vencimiento

## Pasos para Empezar

### 1. Crear Usuario Administrador

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication → Users**
4. Haz clic en **"Add user"**
5. Completa:
   - Email: `lab.admin@dentalflow.gt`
   - Password: Guate502#
   - Marca "Auto Confirm User"
6. Copia el UUID del usuario creado

### 2. Crear Perfil del Usuario

1. Ve a **SQL Editor** en Supabase
2. Ejecuta este código (reemplaza `USER_UUID_HERE` con el UUID que copiaste):

```sql
INSERT INTO profiles (id, full_name, email, global_role, active)
VALUES (
  'USER_UUID_HERE',
  'Administrador Laboratorio',
  'lab.admin@dentalflow.gt',
  'lab_admin',
  true
);
```

### 3. Iniciar la Aplicación

En la terminal, ejecuta:

```bash
npm run dev
```

### 4. Probar el Sistema

#### Como Dentista (Formulario Público):
1. Ve a: `http://localhost:5173/order`
2. Completa el formulario
3. Haz clic en los dientes del odontograma
4. Selecciona el servicio para cada diente
5. Envía la orden

#### Como Personal del Laboratorio:
1. Ve a: `http://localhost:5173`
2. Inicia sesión con:
   - Email: `lab.admin@dentalflow.gt`
   - Password: [la que configuraste]
3. Verás el tablero Kanban con las órdenes

## ¿Qué Puedes Hacer Ahora?

### Panel del Laboratorio

- **Ver órdenes en Kanban**: Las columnas representan los estados del proceso
- **Mover órdenes**: Usa el dropdown en cada tarjeta para cambiar el estado
- **Ver alertas SLA**: Las órdenes vencidas o urgentes están marcadas
- **Tiempo real**: Los cambios se reflejan automáticamente sin recargar

### Formulario de Dentistas

- **Odontograma interactivo**: Sistema FDI completo (32 dientes)
- **Multi-servicio**: Puede pedir diferentes servicios para diferentes dientes
- **Sin login requerido**: Acceso público directo en `/order`
- **Información completa**: Datos del paciente, diagnóstico, notas

## Estados del Proceso

1. 🔵 **Recibido** - Orden nueva
2. 🎨 **En Diseño** - Diseño CAD/CAM
3. 🔨 **En Fabricación** - Manufactura
4. ✅ **Control de Calidad** - Inspección
5. 📦 **Listo para Entrega** - Esperando entrega
6. ✔️ **Entregado** - Completado

## Servicios Precargados

- Corona de Porcelana (Q1,200 / 5 días)
- Corona de Zirconio (Q1,600 / 6 días)
- Prótesis Removible Acrílica (Q2,500 / 8 días)
- Implante Dental (Q3,800 / 10 días)
- Guarda Oclusal (Q750 / 3 días)

## Roles del Staff Disponibles

1. Administrador Global
2. Jefe de Laboratorio
3. Diseño
4. Fabricación
5. Control de Calidad
6. Entrega/Venta

## Verificar la Instalación

### Base de datos:
1. Ve a Supabase → Table Editor
2. Deberías ver estas tablas:
   - laboratories (1 registro)
   - lab_services (5 registros)
   - lab_staff_roles (6 registros)
   - profiles, lab_orders, etc.

### Aplicación:
1. Página de login carga correctamente
2. Formulario público accesible en `/order`
3. Después de login, ves el dashboard Kanban

## Solución de Problemas

### No puedo iniciar sesión
- Verifica que creaste el usuario en Authentication
- Verifica que insertaste el perfil en la tabla `profiles`
- Los UUIDs deben coincidir

### El formulario no envía órdenes
- Verifica que seleccionaste al menos un diente
- Verifica que todos los campos requeridos (*) están completos
- Revisa la consola del navegador para errores

### No veo las órdenes en el Kanban
- Las órdenes canceladas no se muestran
- Verifica que el usuario tenga el rol correcto
- Recarga la página

## Próximos Pasos

Según la guía maestra, puedes expandir con:
- Módulo de clínicas (multi-tenant)
- Sistema de presupuestos
- Facturación
- Integración con Odoo
- BI y reportes avanzados

Ver `docs/guia_maestra_dentalflow_v3.md` para la arquitectura completa.
