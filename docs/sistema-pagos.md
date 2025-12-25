# Sistema de Pagos - DentalFlow

## Descripción General

El sistema de pagos permite registrar y rastrear los pagos recibidos de las clínicas por las órdenes de laboratorio. Incluye seguimiento de saldo pendiente, múltiples métodos de pago y reportes financieros completos.

## Características Principales

### Registro de Pagos
- Registrar pagos parciales o completos para cada orden
- Múltiples métodos de pago soportados
- Cálculo automático de saldo pendiente
- Validación de montos y alertas de sobrepago

### Seguimiento Financiero
- Estado de pago por orden (pendiente, parcial, pagado)
- Historial completo de pagos
- Indicadores visuales en el Kanban
- Totales y promedios en reportes

### Reportes y Estadísticas
- Reporte de pagos por período
- Filtrado por moneda (GTQ/USD)
- Exportación a CSV
- Estadísticas de pagos recibidos

## Arquitectura de Base de Datos

### Tabla `payments`

Almacena cada transacción de pago individual:

```sql
CREATE TABLE payments (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES lab_orders(id),
  amount numeric CHECK (amount > 0),
  currency text CHECK (currency IN ('GTQ', 'USD')),
  payment_method text CHECK (payment_method IN ('cash', 'card', 'transfer', 'check')),
  payment_date date DEFAULT CURRENT_DATE,
  reference_number text,
  notes text,
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

**Campos**:
- `order_id`: Orden asociada al pago
- `amount`: Monto del pago
- `currency`: Moneda (GTQ o USD)
- `payment_method`: Método de pago (efectivo, tarjeta, transferencia, cheque)
- `payment_date`: Fecha en que se recibió el pago
- `reference_number`: Número de referencia (cheque, transacción, etc.)
- `notes`: Notas adicionales sobre el pago
- `recorded_by`: Usuario que registró el pago

### Campos Agregados a `lab_orders`

Se agregaron campos para seguimiento de pagos:

- `paid_amount`: Total pagado hasta el momento (calculado automáticamente)
- `payment_status`: Estado del pago (pending, partial, paid, overdue)
- `payment_due_date`: Fecha límite de pago

### Triggers Automáticos

Se creó un trigger que actualiza automáticamente el estado de pago de una orden:

```sql
CREATE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcula el total pagado
  -- Actualiza paid_amount y payment_status
  -- payment_status = 'pending' si paid_amount = 0
  -- payment_status = 'paid' si paid_amount >= price
  -- payment_status = 'partial' en otros casos
END;
$$ LANGUAGE plpgsql;
```

El trigger se ejecuta automáticamente al:
- Insertar un nuevo pago
- Actualizar un pago existente
- Eliminar un pago

## Seguridad (RLS)

### Políticas de la Tabla `payments`

**Lectura**:
- Lab staff puede ver todos los pagos
- Usuarios de clínica pueden ver pagos de órdenes de su clínica

**Escritura**:
- Solo lab staff puede registrar pagos
- Solo lab_admin puede actualizar pagos existentes
- Solo lab_admin puede eliminar pagos

```sql
-- Ver todos los pagos (lab staff)
CREATE POLICY "Lab staff can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE global_role IN ('lab_admin', 'lab_staff')));

-- Ver pagos de su clínica (clinic users)
CREATE POLICY "Clinic users can view payments for their orders"
  ON payments FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT lo.id FROM lab_orders lo
    INNER JOIN profiles p ON p.clinic_id = lo.clinic_id
    WHERE p.id = auth.uid()
  ));

-- Registrar pagos (lab staff)
CREATE POLICY "Lab staff can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE global_role IN ('lab_admin', 'lab_staff')));
```

## Componentes de UI

### 1. PaymentModal

**Ubicación**: `src/modules/payments/PaymentModal.tsx`

**Función**: Modal para registrar nuevos pagos

**Características**:
- Muestra resumen de la orden (total, pagado, pendiente)
- Validación de montos
- Selección de método de pago con iconos
- Campo de fecha con máximo = hoy
- Campos opcionales: referencia y notas
- Alerta si el monto excede el saldo pendiente

**Métodos de pago**:
- Efectivo (cash)
- Tarjeta (card)
- Transferencia bancaria (transfer)
- Cheque (check)

**Flujo de uso**:
1. Usuario hace clic en "Registrar Pago" en detalle de orden
2. Modal muestra resumen financiero
3. Usuario ingresa monto y selecciona método
4. Sistema valida y registra el pago
5. Estado de orden se actualiza automáticamente

### 2. PaymentList

**Ubicación**: `src/modules/payments/PaymentList.tsx`

**Función**: Lista el historial de pagos de una orden

**Características**:
- Muestra todos los pagos ordenados por fecha (más recientes primero)
- Información de cada pago:
  - Monto y moneda
  - Método de pago con icono
  - Fecha de pago
  - Número de referencia
  - Notas
  - Registrado por (usuario y fecha)
- Botón para eliminar (solo lab_admin)
- Actualización automática después de cambios

### 3. PaymentsReport

**Ubicación**: `src/modules/payments/PaymentsReport.tsx`

**Función**: Reporte financiero completo de pagos

**Características**:
- Filtros:
  - Rango de fechas (desde/hasta)
  - Moneda (GTQ/USD)
- Estadísticas:
  - Total recibido en el período
  - Total pendiente global
  - Cantidad de pagos registrados
  - Promedio por pago
- Tabla detallada con:
  - Fecha del pago
  - Número de orden
  - Clínica
  - Método de pago
  - Monto
  - Referencia
  - Registrado por
- Exportación a CSV

### 4. Integración en OrderDetail

**Ubicación**: `src/modules/lab-orders/OrderDetail.tsx`

**Cambios realizados**:
- Nueva pestaña "Pagos"
- Sección de pago en pestaña "Detalles" que muestra:
  - Precio total
  - Monto pagado
  - Saldo pendiente
  - Estado de pago (badge con color)
- Botón "Registrar Pago" (solo para lab staff)
- Historial de pagos en pestaña dedicada

### 5. Indicadores en KanbanBoard

**Ubicación**: `src/modules/lab-orders/KanbanBoard.tsx`

**Cambios realizados**:
- Icono de wallet en cada tarjeta
- Estado de pago con color:
  - Verde: Pagado
  - Amarillo: Parcial
  - Rojo: Pendiente

## Flujos de Uso

### Flujo para Laboratorio

#### 1. Registrar un Pago

1. **Abrir detalle de orden**:
   - Hacer clic en una orden del Kanban
   - Se abre el modal de detalles

2. **Ir a pestaña de Pagos**:
   - Hacer clic en la pestaña "Pagos"
   - Ver historial actual de pagos

3. **Registrar nuevo pago**:
   - Hacer clic en "Registrar Pago"
   - Ver resumen financiero (total, pagado, pendiente)
   - Ingresar monto del pago
   - Seleccionar método de pago
   - Seleccionar fecha del pago
   - (Opcional) Ingresar número de referencia
   - (Opcional) Agregar notas
   - Hacer clic en "Registrar Pago"

4. **Confirmación automática**:
   - El pago se registra en la base de datos
   - El estado de pago de la orden se actualiza automáticamente
   - El historial se actualiza con el nuevo pago
   - El indicador en el Kanban se actualiza

#### 2. Ver Reporte de Pagos

1. **Acceder al reporte**:
   - Ir al Dashboard
   - Hacer clic en pestaña "Pagos"

2. **Configurar filtros**:
   - Seleccionar fecha de inicio
   - Seleccionar fecha de fin
   - Seleccionar moneda (GTQ o USD)

3. **Analizar estadísticas**:
   - Ver total recibido en el período
   - Ver total pendiente
   - Ver cantidad de pagos
   - Ver promedio por pago

4. **Revisar detalle**:
   - Tabla con todos los pagos del período
   - Ordenados por fecha (más recientes primero)
   - Información completa de cada transacción

5. **Exportar datos** (opcional):
   - Hacer clic en "Exportar CSV"
   - Descargar archivo con todos los pagos del período

#### 3. Gestionar Pagos Existentes

1. **Ver historial en orden**:
   - Abrir detalle de orden
   - Ir a pestaña "Pagos"
   - Ver lista de todos los pagos

2. **Eliminar pago** (solo lab_admin):
   - Hacer clic en botón de eliminar (icono de basura)
   - Confirmar eliminación
   - El estado de la orden se actualiza automáticamente

### Flujo para Clínicas (Solo Lectura)

Los usuarios de clínica pueden:
1. Ver el estado de pago de sus órdenes en el detalle
2. Ver el historial de pagos de sus órdenes
3. **No pueden** registrar o eliminar pagos

## Cálculos Automáticos

### Estado de Pago

El sistema calcula automáticamente el estado basándose en:

```
SI paid_amount = 0:
  payment_status = 'pending'

SI paid_amount >= price:
  payment_status = 'paid'

SI 0 < paid_amount < price:
  payment_status = 'partial'
```

### Saldo Pendiente

```
saldo_pendiente = price - paid_amount
```

### Total Pagado

Se calcula sumando todos los pagos en la misma moneda de la orden:

```sql
SELECT SUM(amount) FROM payments
WHERE order_id = ? AND currency = ?
```

## Métodos de Pago

### Efectivo (cash)
- Pago en moneda física
- Sin referencia necesaria

### Tarjeta (card)
- Pago con tarjeta de crédito/débito
- Referencia: Últimos 4 dígitos o número de autorización

### Transferencia (transfer)
- Transferencia bancaria
- Referencia: Número de transacción bancaria

### Cheque (check)
- Pago con cheque
- Referencia: Número de cheque

## Reportes

### Reporte de Pagos por Período

**Filtros**:
- Rango de fechas
- Moneda (GTQ/USD)

**Métricas**:
- Total recibido en el período
- Total pendiente (de todas las órdenes)
- Cantidad de pagos registrados
- Promedio por pago

**Detalle**:
- Fecha de cada pago
- Orden asociada
- Clínica
- Método de pago
- Monto
- Referencia
- Usuario que registró

**Exportación**:
- Formato CSV
- Todas las columnas de la tabla
- Nombre de archivo: `pagos_YYYY-MM-DD_YYYY-MM-DD.csv`

## Consideraciones de Seguridad

### Validaciones

1. **Monto positivo**: El sistema valida que el monto sea mayor a 0
2. **Moneda correcta**: El pago debe ser en la misma moneda de la orden
3. **Fecha válida**: La fecha de pago no puede ser futura
4. **Sobrepago**: Alerta al usuario si el monto excede el saldo pendiente

### Auditoría

Cada pago registra:
- Quién lo registró (`recorded_by`)
- Cuándo se registró (`created_at`)
- Fecha real del pago (`payment_date`)

### Permisos

- **Lab staff**: Puede ver y registrar pagos
- **Lab admin**: Puede ver, registrar, actualizar y eliminar pagos
- **Clinic users**: Solo pueden ver pagos de sus órdenes

## Casos de Uso Especiales

### Pago Parcial

Una clínica puede pagar en múltiples cuotas:

1. Orden: GTQ 1000.00
2. Pago 1: GTQ 400.00 → Estado: "Parcial"
3. Pago 2: GTQ 300.00 → Estado: "Parcial"
4. Pago 3: GTQ 300.00 → Estado: "Pagado"

Cada pago se registra por separado y el estado se actualiza automáticamente.

### Sobrepago

Si un usuario intenta registrar un pago mayor al saldo:

1. Sistema muestra alerta: "El monto (X) es mayor al saldo pendiente (Y)"
2. Usuario puede confirmar o cancelar
3. Si confirma, el pago se registra
4. Estado cambia a "Pagado" automáticamente

### Corrección de Errores

Si se registró un pago incorrecto:

1. Lab admin puede eliminar el pago
2. Trigger actualiza automáticamente el estado de la orden
3. Se puede registrar un nuevo pago con el monto correcto

### Pagos en Diferente Moneda

El sistema NO permite pagos en diferente moneda de la orden:
- Si la orden es en GTQ, solo se aceptan pagos en GTQ
- Si la orden es en USD, solo se aceptan pagos en USD

## Mejoras Futuras (No Implementado)

### Pagos Automáticos
- Integración con pasarelas de pago
- Cobros recurrentes
- Links de pago por email

### Recordatorios
- Email automático cuando un pago está vencido
- Notificaciones de pagos pendientes
- Resumen semanal de cuentas por cobrar

### Facturación
- Generación automática de facturas
- Comprobantes de pago en PDF
- Integración con facturación electrónica

### Descuentos y Promociones
- Sistema de descuentos por volumen
- Códigos promocionales
- Precios especiales por clínica

### Crédito
- Límite de crédito por clínica
- Términos de pago (15, 30, 60 días)
- Intereses por mora
- Bloqueo automático por deuda

## Solución de Problemas

### El estado no se actualiza después de un pago

**Causa**: El trigger no se ejecutó correctamente
**Solución**:
1. Verificar que el trigger existe: `\df update_order_payment_status`
2. Ejecutar manualmente el cálculo para esa orden
3. Verificar logs de PostgreSQL

### No puedo eliminar un pago

**Causa**: No tienes permisos de lab_admin
**Solución**: Solo usuarios con rol `lab_admin` pueden eliminar pagos

### Los totales no coinciden

**Causa**: Pagos en diferente moneda de la orden
**Solución**: Verificar que todos los pagos estén en la misma moneda de la orden

### El CSV no descarga

**Causa**: Bloqueador de popups del navegador
**Solución**: Permitir descargas automáticas para el sitio

## Referencias

- **Migración**: `supabase/migrations/add_payments_system.sql`
- **Componentes**:
  - `src/modules/payments/PaymentModal.tsx`
  - `src/modules/payments/PaymentList.tsx`
  - `src/modules/payments/PaymentsReport.tsx`
- **Integración**:
  - `src/modules/lab-orders/OrderDetail.tsx`
  - `src/modules/lab-orders/KanbanBoard.tsx`
  - `src/modules/lab/Dashboard.tsx`
