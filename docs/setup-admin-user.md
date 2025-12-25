# Configuración del Usuario Administrador

Para crear el primer usuario administrador del sistema, sigue estos pasos:

## 1. Crear Usuario en Supabase Auth

Ve a tu proyecto de Supabase:
- Dashboard → Authentication → Users
- Haz clic en "Add user"
- Email: `lab.admin@dentalflow.gt`
- Password: `[tu contraseña segura]`
- Marca "Auto Confirm User"

## 2. Crear Perfil del Usuario

Después de crear el usuario en Auth, copia su UUID y ejecuta el siguiente SQL en el Editor SQL de Supabase:

```sql
-- Reemplaza 'USER_UUID_HERE' con el UUID real del usuario creado
INSERT INTO profiles (id, full_name, email, global_role, active)
VALUES (
  'USER_UUID_HERE',
  'Administrador Laboratorio',
  'lab.admin@dentalflow.gt',
  'lab_admin',
  true
);
```

## 3. Asignar Rol en el Laboratorio (Opcional)

Para asignar el usuario a un rol específico en el laboratorio:

```sql
-- Obtener el ID del laboratorio y del rol
DO $$
DECLARE
  lab_id uuid;
  role_id uuid;
  user_id uuid := 'USER_UUID_HERE'; -- Reemplaza con el UUID del usuario
BEGIN
  -- Obtener el ID del laboratorio
  SELECT id INTO lab_id FROM laboratories LIMIT 1;

  -- Obtener el ID del rol "Administrador Global"
  SELECT id INTO role_id FROM lab_staff_roles WHERE name = 'Administrador Global';

  -- Asignar el usuario al rol
  INSERT INTO lab_staff (laboratory_id, user_id, role_id, active)
  VALUES (lab_id, user_id, role_id, true)
  ON CONFLICT DO NOTHING;
END $$;
```

## 4. Verificar

Intenta iniciar sesión en la aplicación con:
- Email: `lab.admin@dentalflow.gt`
- Password: [la contraseña que configuraste]

## Crear Usuarios Adicionales

Para crear más usuarios del staff:

1. Crea el usuario en Authentication
2. Crea su perfil con el rol apropiado:
   - `super_admin` - Acceso total al sistema
   - `lab_admin` - Administrador del laboratorio
   - `lab_staff` - Personal del laboratorio

3. Asigna roles específicos usando la tabla `lab_staff` y los roles de `lab_staff_roles`:
   - Jefe de Laboratorio
   - Diseño
   - Fabricación
   - Control de Calidad
   - Entrega/Venta
