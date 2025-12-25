# Gestión de Archivos Adjuntos - DentalFlow

## Descripción General

El sistema de gestión de archivos permite a los dentistas adjuntar documentos, imágenes y archivos relevantes a las órdenes de laboratorio. Esto incluye radiografías, fotografías intraorales, archivos STL y PDFs.

## Características Implementadas

### 1. Subida de Archivos desde el Formulario Público

Los dentistas pueden adjuntar archivos directamente desde el formulario de orden:

- **Ubicación**: Sección "Archivos Adjuntos (Opcional)" en el formulario de orden
- **Funcionalidad**:
  - Drag & drop de archivos
  - Selección múltiple de archivos
  - Vista previa de archivos seleccionados
  - Barra de progreso durante la subida
  - Validación de tipos y tamaños

### 2. Galería de Archivos en el Panel de Laboratorio

El personal del laboratorio puede ver y gestionar los archivos adjuntos:

- **Ubicación**: Pestaña "Archivos" en el detalle de orden
- **Funcionalidades**:
  - Vista previa de imágenes
  - Descarga de archivos
  - Eliminación de archivos (solo staff del laboratorio)
  - Vista en cuadrícula responsive

## Tipos de Archivos Soportados

### Imágenes
- JPEG / JPG
- PNG
- WEBP

### Documentos
- PDF

### Modelos 3D
- STL
- SLA

## Límites y Restricciones

- **Tamaño máximo por archivo**: 10 MB
- **Número máximo de archivos**: 10 por orden
- **Acceso público**: Solo lectura
- **Eliminación**: Solo staff del laboratorio autenticado

## Estructura de Datos

### Tabla `order_attachments`

```sql
CREATE TABLE order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by_email text,
  uploaded_by_user uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

### Storage Bucket

- **Nombre**: `order-files`
- **Acceso**: Público para lectura
- **Estructura**: `{order_id}/{timestamp}-{random}.{extension}`

## Seguridad

### Row Level Security (RLS)

1. **Subida**: Cualquiera puede subir archivos (necesario para formulario público)
2. **Lectura**: Staff del laboratorio autenticado puede ver todos los archivos
3. **Eliminación**: Solo staff del laboratorio autenticado puede eliminar

### Políticas de Storage

1. **Upload**: Público puede subir a bucket `order-files`
2. **Read**: Público puede leer archivos (necesario para preview en formulario)
3. **Delete**: Solo staff autenticado puede eliminar

## Componentes Implementados

### FileUpload Component

**Ubicación**: `src/modules/shared/components/FileUpload.tsx`

```tsx
<FileUpload
  orderId={orderId}
  uploaderEmail="doctor@clinic.com"
  maxFiles={10}
  maxSizeMB={10}
  onUploadComplete={(attachment) => console.log('Uploaded:', attachment)}
/>
```

**Props**:
- `orderId`: ID de la orden (opcional antes de crear la orden)
- `uploaderEmail`: Email del usuario que sube el archivo
- `maxFiles`: Número máximo de archivos (default: 5)
- `maxSizeMB`: Tamaño máximo en MB (default: 10)
- `accept`: Tipos de archivos aceptados (default: 'image/*,.pdf,.stl')
- `onUploadComplete`: Callback al completar la subida

### FileGallery Component

**Ubicación**: `src/modules/shared/components/FileGallery.tsx`

```tsx
<FileGallery
  orderId={orderId}
  canDelete={true}
/>
```

**Props**:
- `orderId`: ID de la orden
- `canDelete`: Permite eliminar archivos (default: false)

## Flujo de Uso

### Para Dentistas

1. Completan el formulario de orden
2. Opcionalmente, agregan archivos en la sección de adjuntos
3. Arrastra archivos o hace clic para seleccionar
4. Revisan los archivos seleccionados
5. Envían el formulario (crea la orden primero)
6. Los archivos se suben automáticamente después

### Para Personal del Laboratorio

1. Abren el detalle de una orden desde el Kanban
2. Hacen clic en la pestaña "Archivos"
3. Ven todas las imágenes y archivos adjuntos
4. Pueden descargar archivos haciendo clic en el botón de descarga
5. Pueden eliminar archivos si es necesario (solo admins/staff)

## Consideraciones Técnicas

### Validación del Cliente

- Se valida el tipo MIME del archivo
- Se verifica el tamaño antes de subir
- Se limita el número de archivos
- Se muestran errores claros al usuario

### Almacenamiento

Los archivos se almacenan en Supabase Storage con la siguiente estructura:

```
order-files/
  └── {order_id}/
      ├── 1640000000000-abc123.jpg
      ├── 1640000001000-def456.pdf
      └── 1640000002000-ghi789.stl
```

### URLs Públicas

Las URLs de los archivos son públicas para permitir:
- Preview en el formulario público
- Descarga directa sin autenticación adicional
- Compartir archivos vía link

**Nota de Seguridad**: Aunque las URLs son públicas, no son predecibles ya que incluyen UUIDs y timestamps aleatorios.

## Mejoras Futuras (No Implementadas)

1. **Compresión de imágenes**: Reducir automáticamente el tamaño de imágenes grandes
2. **Viewer 3D**: Visualizador integrado para archivos STL
3. **Anotaciones**: Marcar y anotar sobre imágenes
4. **Firma digital**: Validar autenticidad de archivos
5. **Notificaciones**: Alertar cuando se agregan nuevos archivos
6. **Versionado**: Mantener historial de versiones de archivos

## Solución de Problemas

### Error: "File too large"
**Causa**: El archivo excede los 10 MB
**Solución**: Comprimir el archivo o dividirlo en partes más pequeñas

### Error: "Invalid file type"
**Causa**: El tipo de archivo no está en la lista permitida
**Solución**: Convertir el archivo a un formato soportado

### Los archivos no se muestran en la galería
**Causa**: Falta autenticación o permisos RLS
**Solución**: Verificar que el usuario esté autenticado y tenga rol de lab_staff o lab_admin

### Error al eliminar archivos
**Causa**: Falta permiso de eliminación en Storage
**Solución**: Verificar que las políticas de RLS estén correctamente configuradas

## Referencias

- **Supabase Storage Docs**: https://supabase.com/docs/guides/storage
- **RLS Policies**: Ver `supabase/migrations/20251225080000_add_order_attachments.sql`
- **Componentes**: Ver `src/modules/shared/components/`
