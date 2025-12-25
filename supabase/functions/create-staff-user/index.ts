import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'lab_admin' | 'lab_staff' | 'clinic_admin' | 'clinic_staff';
  clinic_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    const { data: requestingProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, clinic_id')
      .eq('id', requestingUser.id)
      .single();

    if (!requestingProfile) {
      throw new Error('Profile not found');
    }

    const isLabAdmin = requestingProfile.role === 'lab_admin';
    const isClinicAdmin = requestingProfile.role === 'clinic_admin';

    if (!isLabAdmin && !isClinicAdmin) {
      throw new Error('Insufficient permissions');
    }

    const body: CreateUserRequest = await req.json();
    const { email, password, full_name, role, clinic_id } = body;

    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields');
    }

    if (isClinicAdmin) {
      if (role !== 'clinic_staff') {
        throw new Error('Clinic admins can only create clinic staff');
      }
      if (clinic_id && clinic_id !== requestingProfile.clinic_id) {
        throw new Error('Cannot create staff for other clinics');
      }
    }

    if (role === 'clinic_admin' || role === 'clinic_staff') {
      if (!clinic_id) {
        throw new Error('clinic_id is required for clinic roles');
      }
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      throw createError;
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        full_name,
        role,
        clinic_id: clinic_id || null,
        active: true,
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw profileError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        email,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating user:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
