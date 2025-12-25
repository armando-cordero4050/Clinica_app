# Configuración de Notificaciones por Email

Este documento explica cómo configurar las notificaciones por email para DentalFlow usando Resend.com.

## Resumen

DentalFlow envía automáticamente 3 tipos de emails:

1. **Email de Confirmación** - Al dentista cuando crea una orden
2. **Notificación al Laboratorio** - Al email del lab cuando llega una orden nueva
3. **Orden Lista** - Al dentista cuando la orden está lista para recoger

## Requisitos

- Cuenta de Resend.com (gratis hasta 3,000 emails/mes)
- Dominio verificado (opcional pero recomendado)

## Paso 1: Crear Cuenta en Resend

1. Visita [resend.com](https://resend.com) y crea una cuenta gratuita
2. Verifica tu email
3. Accede al dashboard de Resend

## Paso 2: Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre descriptivo (ej: "DentalFlow Production")
4. Selecciona los permisos: **Sending access**
5. Copia la API key (la verás solo una vez)

## Paso 3: Configurar Variables de Entorno

Las variables de entorno ya están configuradas automáticamente en Supabase, pero necesitas proporcionar los valores:

### Variables Requeridas:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

### Variables Opcionales:

```bash
LAB_EMAIL=lab@tudominio.com           # Email del laboratorio (default: lab@dentalflow.com)
LAB_PHONE=+502 1234-5678              # Teléfono del lab
LAB_ADDRESS=Guatemala City, Guatemala  # Dirección del lab
FRONTEND_URL=https://tudominio.com    # URL de tu aplicación
```

## Paso 4: Verificar Dominio (Recomendado)

Para evitar que los emails vayan a spam y mejorar la entregabilidad:

1. En Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio (ej: `dentalflow.com`)
4. Sigue las instrucciones para agregar los registros DNS:
   - SPF
   - DKIM
   - DMARC (opcional)

### Sin Dominio Verificado

Si no verificas un dominio, los emails se enviarán desde `onboarding@resend.dev` y tendrán limitaciones:
- Solo puedes enviar a emails que hayas verificado manualmente
- Mayor probabilidad de ir a spam
- Límites más restrictivos

## Paso 5: Configurar Emails "From"

Si verificaste tu dominio, actualiza las Edge Functions para usar tu dominio:

**send-order-confirmation:**
```typescript
from: 'DentalFlow Lab <noreply@tudominio.com>'
```

**notify-lab-new-order:**
```typescript
from: 'DentalFlow System <notifications@tudominio.com>'
```

**notify-order-ready:**
```typescript
from: 'DentalFlow Lab <notifications@tudominio.com>'
```

## Paso 6: Probar las Notificaciones

### Prueba 1: Email de Confirmación

1. Ve al formulario público: `/order`
2. Completa una orden de prueba
3. Usa un email real al que tengas acceso
4. Verifica que recibas el email de confirmación

### Prueba 2: Notificación al Lab

1. Después de crear una orden
2. Verifica que el email del lab (configurado en `LAB_EMAIL`) reciba la notificación

### Prueba 3: Orden Lista

1. Ve al Dashboard
2. Cambia el estado de una orden a "Listo para Entrega"
3. Verifica que el doctor reciba el email de notificación

## Monitoreo de Emails

### En Resend Dashboard

Resend proporciona métricas en tiempo real:
- **Emails Sent** - Total de emails enviados
- **Delivered** - Emails entregados exitosamente
- **Bounced** - Emails rebotados (email inválido)
- **Complaints** - Reportes de spam

### Logs de Edge Functions

Los logs de las Edge Functions están disponibles en:
1. Supabase Dashboard
2. Ve a **Edge Functions**
3. Selecciona la función
4. Ve a **Logs**

## Troubleshooting

### Los emails no se envían

**Verifica:**
1. Que `RESEND_API_KEY` esté configurado correctamente
2. Los logs de las Edge Functions en Supabase
3. Que la API key tenga permisos de envío
4. Que no hayas excedido el límite de envío de Resend

### Los emails van a spam

**Soluciones:**
1. Verifica tu dominio en Resend
2. Configura SPF, DKIM y DMARC
3. No uses palabras spam en los asuntos
4. Mantén una buena reputación de envío

### Error: "RESEND_API_KEY no está configurado"

Esto significa que la variable de entorno no está disponible. Contacta al administrador del sistema para configurarla.

## Límites del Plan Gratuito de Resend

- **3,000 emails/mes**
- **100 emails/día**
- Todos los emails deben ir a dominios verificados o emails verificados

Para más emails, considera actualizar a un plan de pago.

## Costos Estimados

Para un laboratorio con **50 órdenes/día**:
- 50 confirmaciones a dentistas
- 50 notificaciones al lab
- 50 notificaciones de orden lista
- **Total: 150 emails/día = 4,500 emails/mes**

**Costo con Resend:**
- Plan gratuito: NO es suficiente (3,000/mes)
- Plan de pago: ~$20/mes (50,000 emails)

## Alternativas a Resend

Si prefieres otro proveedor:

1. **SendGrid** - Hasta 100 emails/día gratis
2. **Mailgun** - Primeros 5,000 emails gratis (3 meses)
3. **Amazon SES** - $0.10 por 1,000 emails

Para cambiar de proveedor, solo necesitas modificar las Edge Functions.

## Personalización de Templates

Los templates de email están en las Edge Functions. Para personalizarlos:

1. Ve a `supabase/functions/[nombre-funcion]/index.ts`
2. Modifica la variable `emailHtml`
3. Re-despliega la función

## Soporte

- **Resend Docs:** [resend.com/docs](https://resend.com/docs)
- **Supabase Edge Functions:** [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

---

## Checklist de Configuración

- [ ] Crear cuenta en Resend.com
- [ ] Obtener API Key
- [ ] Configurar `RESEND_API_KEY`
- [ ] (Opcional) Verificar dominio
- [ ] Probar email de confirmación
- [ ] Probar notificación al lab
- [ ] Probar notificación orden lista
- [ ] Monitorear métricas en Resend

Una vez completado este checklist, las notificaciones por email estarán completamente funcionales.
