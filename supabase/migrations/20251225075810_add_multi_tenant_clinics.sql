/*
  # Multi-Tenant Clinics Support

  ## Overview
  This migration adds support for multiple clinics (multi-tenant architecture):
  - Clinics can register and manage their own staff
  - Each order is associated with a specific clinic
  - Lab staff can see all clinics and their orders
  - Clinic staff can only see their own clinic's data

  ## New Tables
  - `clinics`: Dental clinics using the lab services
    - `id` (uuid, primary key)
    - `name` (text, clinic name)
    - `contact_name` (text, primary contact)
    - `email` (text, clinic email)
    - `phone` (text)
    - `address` (text)
    - `city` (text)
    - `country` (text)
    - `active` (boolean)
    - `created_at` (timestamptz)

  ## Modified Tables
  - `profiles`: Added `clinic_id` to associate users with clinics
  - `lab_orders`: Added `clinic_id` for proper data isolation

  ## New Roles
  - `clinic_admin`: Can manage their clinic and staff
  - `clinic_staff`: Can create orders for their clinic
  - Lab roles remain: `lab_admin`, `lab_staff`

  ## Security
  - RLS enabled on all tables
  - Clinic users can only see their own clinic's data
  - Lab users can see all data
  - Proper data isolation by clinic_id
*/

CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  city text,
  country text DEFAULT 'Guatemala',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinics_email ON clinics(email);
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics(active);

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN clinic_id uuid REFERENCES clinics(id);
    CREATE INDEX idx_profiles_clinic_id ON profiles(clinic_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_orders' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE lab_orders ADD COLUMN clinic_id uuid REFERENCES clinics(id);
    CREATE INDEX idx_lab_orders_clinic_id ON lab_orders(clinic_id);
  END IF;
END $$;

CREATE POLICY "Lab staff can view all clinics"
  ON clinics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Clinic users can view their own clinic"
  ON clinics FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT clinic_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.clinic_id IS NOT NULL
    )
  );

CREATE POLICY "Lab admin can insert clinics"
  ON clinics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role = 'lab_admin'
    )
  );

CREATE POLICY "Lab admin can update clinics"
  ON clinics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role = 'lab_admin'
    )
  );

CREATE POLICY "Clinic admin can update their own clinic"
  ON clinics FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT clinic_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role = 'clinic_admin'
    )
  );

DROP POLICY IF EXISTS "Lab staff can view all orders" ON lab_orders;
DROP POLICY IF EXISTS "Lab staff can update orders" ON lab_orders;
DROP POLICY IF EXISTS "Lab staff can delete orders" ON lab_orders;

CREATE POLICY "Lab staff can view all orders"
  ON lab_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Clinic users can view their clinic orders"
  ON lab_orders FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.clinic_id IS NOT NULL
    )
  );

CREATE POLICY "Clinic users can insert orders for their clinic"
  ON lab_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.clinic_id IS NOT NULL
    )
  );

CREATE POLICY "Lab staff can update orders"
  ON lab_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Lab staff can delete orders"
  ON lab_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role = 'lab_admin'
    )
  );

CREATE OR REPLACE FUNCTION update_clinic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_clinic_updated_at();
