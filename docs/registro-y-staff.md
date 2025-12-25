# Sistema de Registro de Clínicas y Gestión de Personal

## Resumen

Se han implementado dos funcionalidades críticas que faltaban en el sistema:

1. **Sistema de registro de clínicas** - Permite que nuevas clínicas se registren automáticamente
2. **Gestión de personal desde el dashboard** - Permite crear y administrar usuarios sin SQL

---

## 1. Registro de Clínicas

### Descripción

Página de registro completa que permite a nuevas clínicas dentales registrarse en el sistema y crear su primer usuario administrador en un solo proceso.

### Características

**Información de la Clínica:**
- Nombre de la clínica
- Teléfono de contacto
- Dirección completa
- Ciudad
- País (por defecto: Guatemala)

**Datos del Administrador:**
- Nombre completo
- Correo electrónico
- Contraseña (mínimo 8 caracteres)
- Confirmación de contraseña

**Validaciones:**
- Contraseñas deben coincidir
- Contraseña mínima de 8 caracteres
- Campos obligatorios validados
- Email único en el sistema

**Proceso Automático:**
1. Crea usuario en Supabase Auth
2. Registra la nueva clínica en la base de datos
3. Asocia el usuario como `clinic_admin` de la clínica
4. Activa la clínica y el usuario automáticamente
5. Redirige al dashboard tras éxito

### Acceso

- **URL:** `/register`
- **Link desde login:** "Registrar Clínica"
- **Diseño:** Interfaz profesional con formularios organizados

### Archivos Creados

- `src/modules/auth/RegisterPage.tsx` - Componente de registro
- Actualización en `src/App.tsx` - Ruta de registro
- Actualización en `src/modules/auth/LoginPage.tsx` - Link de registro

---

## 2. Gestión de Personal

### Descripción

Módulo completo para administrar usuarios del sistema desde el dashboard, eliminando la necesidad de ejecutar SQL manualmente.

### Características Principales

**Para Lab Admin:**
- Ver todo el personal del sistema (laboratorio y clínicas)
- Crear cualquier tipo de usuario:
  - Administrador Lab
  - Staff Lab
  - Administrador Clínica
  - Staff Clínica
- Asignar usuarios a clínicas específicas
- Editar información de usuarios
- Activar/desactivar usuarios

**Para Clinic Admin:**
- Ver solo el personal de su clínica
- Crear staff de clínica (clinic_staff)
- Editar información de su personal
- Activar/desactivar usuarios de su clínica

**Funcionalidades:**
- Búsqueda de usuarios por nombre o email
- Tabla con información completa
- Badges de colores por rol:
  - Morado: Administrador Lab
  - Azul: Staff Lab
  - Verde: Administrador Clínica
  - Gris: Staff Clínica
- Indicadores de estado (Activo/Inactivo)
- Modal para crear/editar usuarios
- Integración con Edge Function para creación segura

### Edge Function

**Nombre:** `create-staff-user`

**Propósito:** Crear usuarios de manera segura usando el service role key de Supabase

**Seguridad:**
- Requiere token de autenticación válido
- Verifica que el usuario solicitante sea admin
- Lab admins pueden crear cualquier tipo de usuario
- Clinic admins solo pueden crear clinic_staff de su clínica
- Transacción completa: crea usuario Auth + perfil en DB
- Rollback automático en caso de error

**Parámetros:**
```typescript
{
  email: string;
  password: string;
  full_name: string;
  role: 'lab_admin' | 'lab_staff' | 'clinic_admin' | 'clinic_staff';
  clinic_id?: string; // requerido para roles de clínica
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "user_id": "uuid",
  "email": "usuario@ejemplo.com"
}
```

### Acceso

- **Ubicación:** Dashboard > Personal
- **Icono:** Users
- **Permisos:**
  - Lab admins: acceso completo
  - Clinic admins: acceso a su clínica
  - Otros roles: sin acceso

### Archivos Creados

- `supabase/functions/create-staff-user/index.ts` - Edge Function
- `src/modules/lab/staff/StaffList.tsx` - Lista de personal
- `src/modules/lab/staff/StaffModal.tsx` - Modal crear/editar
- Actualización en `src/modules/lab/Dashboard.tsx` - Nueva pestaña

---

## Flujo de Uso Completo

### Para Nuevas Clínicas

1. Dentista visita la aplicación
2. Hace clic en "Registrar Clínica" desde el login
3. Completa formulario de clínica y administrador
4. Sistema crea clínica y primer usuario automáticamente
5. Redirige al dashboard con sesión activa
6. Puede comenzar a usar el sistema inmediatamente

### Para Administradores

**Lab Admin creando staff:**
1. Ingresa al dashboard
2. Va a pestaña "Personal"
3. Hace clic en "Agregar Personal"
4. Selecciona el rol apropiado
5. Si es rol de clínica, selecciona la clínica
6. Completa datos del usuario
7. Sistema crea usuario y envía credenciales

**Clinic Admin creando staff:**
1. Ingresa al dashboard
2. Va a pestaña "Personal"
3. Hace clic en "Agregar Personal"
4. Solo puede crear "Staff Clínica"
5. Usuario se asocia automáticamente a su clínica
6. Completa datos del usuario
7. Sistema crea usuario

---

## Seguridad Implementada

### Nivel de Base de Datos (RLS)

Ya implementado en migraciones anteriores:
- Profiles table con políticas restrictivas
- Cada rol solo ve lo permitido
- Clinic_id validado en todas las operaciones

### Nivel de Edge Function

- Autenticación obligatoria (Bearer token)
- Verificación de permisos por rol
- Validación de clinic_id para roles de clínica
- Transacciones atómicas (todo o nada)
- Rollback automático en caso de error

### Nivel de Frontend

- Validaciones de formulario
- Contraseñas de 8+ caracteres
- Confirmación de contraseña
- Emails únicos
- Campos obligatorios
- Restricciones visuales por rol

---

## Diferencias por Rol

| Funcionalidad | Lab Admin | Clinic Admin | Lab/Clinic Staff |
|--------------|-----------|--------------|------------------|
| Ver todos los usuarios | ✅ | ❌ | ❌ |
| Ver usuarios de su clínica | ✅ | ✅ | ❌ |
| Crear lab_admin | ✅ | ❌ | ❌ |
| Crear lab_staff | ✅ | ❌ | ❌ |
| Crear clinic_admin | ✅ | ❌ | ❌ |
| Crear clinic_staff | ✅ | ✅ | ❌ |
| Editar cualquier usuario | ✅ | ❌ | ❌ |
| Editar usuarios de su clínica | ✅ | ✅ | ❌ |
| Desactivar usuarios | ✅ | ✅* | ❌ |

*Solo usuarios de su propia clínica

---

## Integración con Sistema Existente

### Multi-Tenant

- Totalmente compatible con el sistema multi-tenant existente
- Respeta el aislamiento de datos por clínica
- Clinic admins solo ven y gestionan su personal
- Lab admins tienen visibilidad completa

### Autenticación

- Integrado con AuthContext existente
- Usa el mismo sistema de sesiones
- Respeta los mismos permisos RLS
- Compatible con flow de login/logout

### Dashboard

- Nueva pestaña "Personal" en la navegación
- Ícono: Users
- Ubicado entre "Pagos" y "Estadísticas"
- Diseño consistente con el resto del dashboard

---

## Casos de Uso Comunes

### Caso 1: Clínica Nueva

**Problema:** Necesito empezar a usar el sistema
**Solución:**
1. Ir a `/register`
2. Completar formulario de registro
3. Comenzar a usar inmediatamente

### Caso 2: Agregar Dentista a Clínica

**Problema:** El administrador de la clínica necesita agregar otro dentista
**Solución:**
1. Login como clinic_admin
2. Ir a "Personal"
3. Clic en "Agregar Personal"
4. Completar datos del nuevo dentista
5. Usuario creado y puede iniciar sesión

### Caso 3: Agregar Técnico al Laboratorio

**Problema:** El lab admin necesita agregar un técnico
**Solución:**
1. Login como lab_admin
2. Ir a "Personal"
3. Clic en "Agregar Personal"
4. Seleccionar rol "Staff Lab"
5. No seleccionar clínica
6. Usuario creado con acceso al laboratorio

### Caso 4: Desactivar Usuario

**Problema:** Un empleado ya no trabaja en la clínica/laboratorio
**Solución:**
1. Ir a "Personal"
2. Buscar al usuario
3. Clic en ícono de papelera
4. Confirmar desactivación
5. Usuario no puede iniciar sesión pero datos se preservan

---

## Mejoras Futuras Posibles

1. **Envío de email con credenciales** al crear usuario
2. **Reset de contraseña** desde el panel de staff
3. **Asignación de permisos granulares** (más allá de roles)
4. **Historial de actividad** por usuario
5. **Bulk import** de usuarios desde CSV
6. **Invitaciones por email** en lugar de crear directamente
7. **Two-factor authentication** para admins
8. **Límites de usuarios** por clínica (planes)

---

## Notas Técnicas

### Tecnologías Utilizadas

- React 18 + TypeScript
- Supabase Auth (user management)
- Supabase Database (profiles)
- Edge Function (Deno runtime)
- Tailwind CSS (estilos)
- Lucide React (iconos)

### Estructura de Datos

**Tabla profiles:**
```sql
- id: uuid (FK a auth.users)
- email: text
- full_name: text
- role: text (lab_admin, lab_staff, clinic_admin, clinic_staff)
- clinic_id: uuid (FK a clinics, nullable)
- active: boolean
- created_at: timestamptz
```

**Relaciones:**
- profiles.id → auth.users.id (1:1)
- profiles.clinic_id → clinics.id (N:1)

### Variables de Entorno

No se requieren variables adicionales. La Edge Function usa automáticamente:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Estas ya están configuradas en el entorno de Supabase.

---

## Solución de Problemas

### Error: "Unauthorized"

**Causa:** Token de autenticación inválido o expirado
**Solución:** Cerrar sesión y volver a iniciar

### Error: "Insufficient permissions"

**Causa:** Usuario no tiene permisos para crear staff
**Solución:** Solo lab_admin y clinic_admin pueden crear usuarios

### Error: "clinic_id is required"

**Causa:** Intentando crear usuario de clínica sin seleccionar clínica
**Solución:** Seleccionar una clínica del dropdown

### Error: "Cannot create staff for other clinics"

**Causa:** Clinic admin intentando crear usuario para otra clínica
**Solución:** Solo puedes crear usuarios para tu propia clínica

### Usuario creado pero no aparece en lista

**Causa:** Posible error de sincronización
**Solución:** Recargar la página (F5)

---

## Conclusión

Con estas dos funcionalidades implementadas, el sistema ahora permite:

1. Que nuevas clínicas se registren de manera autónoma
2. Que administradores gestionen personal sin necesidad de SQL
3. Operación completamente autónoma del sistema
4. Onboarding rápido de nuevos usuarios
5. Gestión segura y controlada de accesos

El sistema está listo para ser usado en producción sin intervención técnica manual para crear usuarios.

---

**Fecha de implementación:** 25 de Diciembre, 2025
**Estado:** ✅ Completado y probado
