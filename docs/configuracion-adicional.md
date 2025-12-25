# Configuración Adicional

## Agregar Más Usuarios del Staff

### Opción 1: Crear Usuario Completo (Autenticado)

Para usuarios que necesitan acceso al sistema:

1. **Crear en Authentication**:
   - Dashboard Supabase → Authentication → Users → Add user
   - Email: `usuario@dentalflow.gt`
   - Password: [contraseña segura]
   - Auto Confirm User: ✓

2. **Crear Perfil**:
```sql
-- Reemplaza USER_UUID con el UUID del usuario creado
INSERT INTO profiles (id, full_name, email, global_role, active)
VALUES (
  'USER_UUID',
  'Nombre del Usuario',
  'usuario@dentalflow.gt',
  'lab_staff',  -- puede ser: super_admin, lab_admin, lab_staff
  true
);
```

3. **Asignar Rol Específico** (opcional):
```sql
-- Asignar un rol específico del laboratorio
INSERT INTO lab_staff (laboratory_id, user_id, role_id)
SELECT
  (SELECT id FROM laboratories LIMIT 1),
  'USER_UUID',
  (SELECT id FROM lab_staff_roles WHERE name = 'Diseño')  -- o el rol que corresponda
ON CONFLICT DO NOTHING;
```

### Roles Disponibles

- **super_admin**: Acceso total al sistema
- **lab_admin**: Administrador del laboratorio (puede configurar servicios, ver todo)
- **lab_staff**: Personal del laboratorio (puede ver y actualizar órdenes)

### Roles Específicos del Laboratorio

- Administrador Global
- Jefe de Laboratorio
- Diseño
- Fabricación
- Control de Calidad
- Entrega/Venta

## Agregar Más Servicios

```sql
-- Obtener el ID del laboratorio
DO $$
DECLARE
  lab_id uuid;
BEGIN
  SELECT id INTO lab_id FROM laboratories LIMIT 1;

  -- Insertar nuevos servicios
  INSERT INTO lab_services (
    laboratory_id,
    name,
    description,
    category,
    price_gtq,
    price_usd,
    turnaround_days,
    active
  ) VALUES
    (
      lab_id,
      'Puente de 3 Unidades',
      'Puente fijo de porcelana',
      'Prótesis Fija',
      3200.00,
      410.26,
      7,
      true
    ),
    (
      lab_id,
      'Carilla de Porcelana',
      'Carilla estética de porcelana',
      'Estética',
      1800.00,
      230.77,
      5,
      true
    ),
    (
      lab_id,
      'Prótesis Total Superior',
      'Dentadura completa superior',
      'Prótesis Removible',
      3500.00,
      448.72,
      10,
      true
    ),
    (
      lab_id,
      'Férula de Michigan',
      'Férula para bruxismo',
      'Ortodoncia',
      950.00,
      121.79,
      3,
      true
    );
END $$;
```

## Modificar Servicios Existentes

### Cambiar Precio

```sql
UPDATE lab_services
SET
  price_gtq = 1500.00,
  price_usd = 192.31
WHERE name = 'Corona de Porcelana';
```

### Cambiar Tiempo de Fabricación

```sql
UPDATE lab_services
SET turnaround_days = 4
WHERE name = 'Guarda Oclusal';
```

### Desactivar un Servicio

```sql
-- No eliminar, solo desactivar
UPDATE lab_services
SET active = false
WHERE name = 'Nombre del Servicio';
```

## Configurar el Laboratorio

### Actualizar Información

```sql
UPDATE laboratories
SET
  name = 'Nuevo Nombre del Laboratorio',
  phone = '+502 1234-5678',
  address = 'Nueva Dirección, Ciudad',
  tax_id = 'NIT-12345678'
WHERE id = (SELECT id FROM laboratories LIMIT 1);
```

### Cambiar Moneda Predeterminada

```sql
UPDATE laboratories
SET default_currency = 'USD'  -- o 'GTQ'
WHERE id = (SELECT id FROM laboratories LIMIT 1);
```

### Cambiar Tasa de Impuesto

```sql
UPDATE laboratories
SET tax_rate = 0.15  -- 15%
WHERE id = (SELECT id FROM laboratories LIMIT 1);
```

## Crear Nuevos Roles del Staff

```sql
INSERT INTO lab_staff_roles (name, description, color, display_order)
VALUES
  ('Recepción', 'Recepción de órdenes y atención al cliente', '#EC4899', 7),
  ('Empaque', 'Empaque y preparación para entrega', '#14B8A6', 8);
```

## Ver Estadísticas Básicas

### Órdenes por Estado

```sql
SELECT
  status,
  COUNT(*) as total,
  ROUND(AVG(price), 2) as precio_promedio
FROM lab_orders
GROUP BY status
ORDER BY
  CASE status
    WHEN 'received' THEN 1
    WHEN 'in_design' THEN 2
    WHEN 'in_fabrication' THEN 3
    WHEN 'quality_control' THEN 4
    WHEN 'ready_delivery' THEN 5
    WHEN 'delivered' THEN 6
    ELSE 7
  END;
```

### Servicios Más Solicitados

```sql
SELECT
  service_name,
  COUNT(*) as total_ordenes,
  currency,
  ROUND(AVG(price), 2) as precio_promedio
FROM lab_orders
WHERE status != 'cancelled'
GROUP BY service_name, currency
ORDER BY total_ordenes DESC;
```

### Órdenes por Clínica

```sql
SELECT
  clinic_name,
  COUNT(*) as total_ordenes,
  SUM(price) as valor_total,
  currency
FROM lab_orders
WHERE status != 'cancelled'
GROUP BY clinic_name, currency
ORDER BY total_ordenes DESC;
```

### Órdenes Vencidas o Por Vencer

```sql
SELECT
  order_number,
  clinic_name,
  doctor_name,
  service_name,
  status,
  due_date,
  EXTRACT(DAY FROM (due_date - CURRENT_DATE)) as dias_restantes
FROM lab_orders
WHERE
  status NOT IN ('delivered', 'cancelled')
  AND due_date <= CURRENT_DATE + INTERVAL '3 days'
ORDER BY due_date ASC;
```

## Limpiar Datos de Prueba

Si necesitas limpiar órdenes de prueba:

```sql
-- Ver órdenes
SELECT order_number, clinic_name, service_name, created_at
FROM lab_orders
ORDER BY created_at DESC;

-- Eliminar una orden específica
DELETE FROM lab_orders WHERE order_number = 'DF25-00001';

-- O eliminar todas las órdenes de prueba (¡CUIDADO!)
-- TRUNCATE lab_orders CASCADE;
-- TRUNCATE order_status_history CASCADE;
-- TRUNCATE odontogram_selections CASCADE;
```

## Backup y Restore

### Backup Manual

1. Ve a Supabase Dashboard
2. Settings → Database
3. Haz clic en "Create backup"

### Backup Automático

Supabase hace backups automáticos diarios en el plan gratuito.

## Seguridad

### Cambiar Contraseña de Usuario

Los usuarios pueden cambiar su contraseña desde la aplicación, o puedes hacerlo desde:
- Supabase Dashboard → Authentication → Users
- Clic en el usuario → Reset password

### Deshabilitar Usuario

```sql
UPDATE profiles
SET active = false
WHERE email = 'usuario@dentalflow.gt';
```

### Eliminar Usuario

1. Primero deshabilita en profiles
2. Luego elimina desde Authentication en Supabase Dashboard
