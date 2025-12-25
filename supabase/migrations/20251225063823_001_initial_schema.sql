/*
  # DentalFlow Initial Schema - Simplified Version
  
  ## Overview
  Foundation for dental laboratory management system
  
  ## Tables
  1. laboratories - Lab configuration
  2. profiles - User metadata and roles
  3. lab_staff_roles - Predefined staff roles
  4. lab_staff - User assignments to roles
  5. lab_services - Service catalog
  6. lab_orders - Orders from dentists
  7. order_status_history - Status tracking
  8. odontogram_selections - Tooth selections
  
  ## Security
  RLS enabled with role-based policies
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- LABORATORIES
CREATE TABLE laboratories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  country text DEFAULT 'GT',
  phone text,
  address text,
  tax_id text DEFAULT 'CF',
  tax_rate numeric(5,4) DEFAULT 0.12,
  default_currency text DEFAULT 'GTQ' CHECK (default_currency IN ('GTQ', 'USD')),
  allowed_currencies text[] DEFAULT ARRAY['GTQ', 'USD'],
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PROFILES
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  global_role text DEFAULT 'lab_staff' CHECK (global_role IN ('super_admin', 'lab_admin', 'lab_staff')),
  avatar_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- LAB STAFF ROLES
CREATE TABLE lab_staff_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#6B7280',
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- LAB STAFF
CREATE TABLE lab_staff (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  laboratory_id uuid NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES lab_staff_roles(id) ON DELETE RESTRICT,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(laboratory_id, user_id, role_id)
);

-- LAB SERVICES
CREATE TABLE lab_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  laboratory_id uuid NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  price_gtq numeric(10,2) NOT NULL DEFAULT 0,
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  turnaround_days int NOT NULL DEFAULT 5,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- LAB ORDERS
CREATE TABLE lab_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  laboratory_id uuid NOT NULL REFERENCES laboratories(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE,
  clinic_name text NOT NULL,
  doctor_name text NOT NULL,
  doctor_email text NOT NULL,
  patient_name text NOT NULL,
  patient_age int,
  patient_gender text CHECK (patient_gender IN ('M', 'F', 'Otro')),
  service_id uuid NOT NULL REFERENCES lab_services(id) ON DELETE RESTRICT,
  service_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('GTQ', 'USD')),
  diagnosis text,
  doctor_notes text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 
    'in_design', 
    'in_fabrication', 
    'quality_control', 
    'ready_delivery', 
    'delivered',
    'cancelled'
  )),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ORDER STATUS HISTORY
CREATE TABLE order_status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ODONTOGRAM SELECTIONS
CREATE TABLE odontogram_selections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  tooth_number text NOT NULL,
  tooth_notation text DEFAULT 'FDI',
  condition_type text NOT NULL CHECK (condition_type IN (
    'caries',
    'restoration',
    'crown',
    'implant',
    'prosthesis',
    'missing',
    'endodontics',
    'orthodontics',
    'surgery'
  )),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  year_suffix text;
BEGIN
  year_suffix := to_char(now(), 'YY');
  SELECT 'DF' || year_suffix || '-' || LPAD((COALESCE(COUNT(*), 0) + 1)::text, 5, '0')
  INTO new_number
  FROM lab_orders
  WHERE order_number LIKE 'DF' || year_suffix || '%';
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_due_date(service_uuid uuid)
RETURNS date AS $$
DECLARE
  turnaround int;
BEGIN
  SELECT turnaround_days INTO turnaround
  FROM lab_services
  WHERE id = service_uuid;
  RETURN (CURRENT_DATE + (turnaround || ' days')::interval)::date;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
CREATE OR REPLACE FUNCTION set_order_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  IF NEW.due_date IS NULL THEN
    NEW.due_date := calculate_due_date(NEW.service_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_defaults_trigger
  BEFORE INSERT ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_defaults();

CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
    IF NEW.status = 'delivered' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_status_change_trigger
  BEFORE UPDATE ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_laboratories_updated_at
  BEFORE UPDATE ON laboratories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lab_staff_updated_at
  BEFORE UPDATE ON lab_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_lab_services_updated_at
  BEFORE UPDATE ON lab_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ROW LEVEL SECURITY
ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontogram_selections ENABLE ROW LEVEL SECURITY;

-- LABORATORIES POLICIES
CREATE POLICY "Lab admins can view laboratory"
  ON laboratories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('super_admin', 'lab_admin')
    )
  );

CREATE POLICY "Lab admins can update laboratory"
  ON laboratories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('super_admin', 'lab_admin')
    )
  );

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.global_role IN ('super_admin', 'lab_admin')
    )
  );

-- LAB STAFF ROLES POLICIES
CREATE POLICY "Authenticated users can view roles"
  ON lab_staff_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON lab_staff_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('super_admin', 'lab_admin')
    )
  );

-- LAB STAFF POLICIES
CREATE POLICY "Staff can view own assignments"
  ON lab_staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all staff"
  ON lab_staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('super_admin', 'lab_admin')
    )
  );

CREATE POLICY "Admins can manage staff"
  ON lab_staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('super_admin', 'lab_admin')
    )
  );

-- LAB SERVICES POLICIES
CREATE POLICY "Anyone can view active services"
  ON lab_services FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage services"
  ON lab_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('super_admin', 'lab_admin')
    )
  );

-- LAB ORDERS POLICIES
CREATE POLICY "Lab staff can view orders"
  ON lab_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Lab staff can update orders"
  ON lab_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Public can create orders"
  ON lab_orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- ORDER STATUS HISTORY POLICIES
CREATE POLICY "Lab staff can view status history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Lab staff can insert status history"
  ON order_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- ODONTOGRAM SELECTIONS POLICIES
CREATE POLICY "Lab staff can view selections"
  ON odontogram_selections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Public can create selections"
  ON odontogram_selections FOR INSERT
  TO anon
  WITH CHECK (true);
