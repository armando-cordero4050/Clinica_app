import { Resend } from 'npm:resend@3.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface OrderData {
  order_number: string;
  clinic_name: string;
  doctor_name: string;
  doctor_email: string;
  patient_name: string;
  service_name: string;
  price: number;
  currency: string;
  due_date: string;
  teeth_selected: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY no está configurado');
    }

    const resend = new Resend(resendApiKey);
    const orderData: OrderData = await req.json();

    const teethList = orderData.teeth_selected.length > 0 
      ? orderData.teeth_selected.join(', ')
      : 'No especificado';

    const dueDate = new Date(orderData.due_date).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Orden - DentalFlow</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">DentalFlow Lab</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Confirmación de Orden</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin: 0 0 20px 0;">Estimado Dr./Dra. <strong>${orderData.doctor_name}</strong>,</p>
    
    <p style="font-size: 15px; color: #4b5563; margin: 0 0 25px 0;">
      Hemos recibido su orden exitosamente. A continuación encuentra los detalles:
    </p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Número de Orden:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${orderData.order_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Clínica:</td>
          <td style="padding: 8px 0; text-align: right;">${orderData.clinic_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Paciente:</td>
          <td style="padding: 8px 0; text-align: right;">${orderData.patient_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Servicio:</td>
          <td style="padding: 8px 0; text-align: right;">${orderData.service_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Dientes:</td>
          <td style="padding: 8px 0; text-align: right;">${teethList}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 2px solid #d1d5db; padding-top: 12px;">Total:</td>
          <td style="padding: 8px 0; font-size: 20px; font-weight: 700; color: #2563eb; text-align: right; border-top: 2px solid #d1d5db; padding-top: 12px;">${orderData.currency} ${orderData.price.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>Fecha estimada de entrega:</strong> ${dueDate}
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin: 25px 0;">
      Nos pondremos en contacto con usted cuando su orden esté lista para recoger.
    </p>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="font-size: 13px; color: #9ca3af; margin: 0;">DentalFlow Lab Guatemala</p>
      <p style="font-size: 13px; color: #9ca3af; margin: 5px 0 0 0;">Este es un email automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'DentalFlow Lab <noreply@dentalflow.com>',
      to: [orderData.doctor_email],
      subject: `Confirmación de Orden ${orderData.order_number}`,
      html: emailHtml,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data?.id }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
