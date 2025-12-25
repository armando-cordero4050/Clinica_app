import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      laboratories: {
        Row: {
          id: string;
          name: string;
          country: string;
          phone: string | null;
          address: string | null;
          tax_id: string;
          tax_rate: number;
          default_currency: 'GTQ' | 'USD';
          allowed_currencies: string[];
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          global_role: 'super_admin' | 'lab_admin' | 'lab_staff' | 'clinic_admin' | 'clinic_staff';
          clinic_id: string | null;
          avatar_url: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      lab_staff_roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          display_order: number;
          created_at: string;
        };
      };
      lab_services: {
        Row: {
          id: string;
          laboratory_id: string;
          name: string;
          description: string | null;
          category: string | null;
          price_gtq: number;
          price_usd: number;
          turnaround_days: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      lab_orders: {
        Row: {
          id: string;
          laboratory_id: string;
          order_number: string;
          clinic_name: string;
          doctor_name: string;
          doctor_email: string;
          patient_name: string;
          patient_age: number | null;
          patient_gender: 'M' | 'F' | 'Otro' | null;
          service_id: string;
          service_name: string;
          price: number;
          currency: 'GTQ' | 'USD';
          diagnosis: string | null;
          doctor_notes: string | null;
          status: 'received' | 'in_design' | 'in_fabrication' | 'quality_control' | 'ready_delivery' | 'delivered' | 'cancelled';
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      odontogram_selections: {
        Row: {
          id: string;
          order_id: string;
          tooth_number: string;
          tooth_notation: string;
          condition_type: 'caries' | 'restoration' | 'crown' | 'implant' | 'prosthesis' | 'missing' | 'endodontics' | 'orthodontics' | 'surgery';
          notes: string | null;
          created_at: string;
        };
      };
    };
  };
};
