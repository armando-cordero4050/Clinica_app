/*
  # Fix Recursive RLS Policies - V2

  ## Changes
  1. Create helper function to get user role without triggering RLS
  2. Replace recursive policies with non-recursive versions
  3. Ensure all policies work without causing infinite loops

  ## Security
  - Use security definer function to bypass RLS when checking roles
  - Maintain same security model without recursion
*/

-- Create a function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT global_role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop all problematic policies on profiles
DROP POLICY IF EXISTS "Admins can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate profiles policies without recursion
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'));

-- Update laboratories policies to use the helper function
DROP POLICY IF EXISTS "Admins can update laboratories" ON laboratories;

CREATE POLICY "Admins can update laboratories"
  ON laboratories FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_admin'));

-- Update other policies that were causing issues
DROP POLICY IF EXISTS "Admins can manage roles" ON lab_staff_roles;

CREATE POLICY "Admins can insert roles"
  ON lab_staff_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_admin'));

CREATE POLICY "Admins can update roles"
  ON lab_staff_roles FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_admin'));

CREATE POLICY "Admins can delete roles"
  ON lab_staff_roles FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'));

-- Update lab_staff policies
DROP POLICY IF EXISTS "Admins can view all staff" ON lab_staff;
DROP POLICY IF EXISTS "Admins can manage staff" ON lab_staff;

CREATE POLICY "Admins can view all staff"
  ON lab_staff FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'));

CREATE POLICY "Admins can insert staff"
  ON lab_staff FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_admin'));

CREATE POLICY "Admins can update staff"
  ON lab_staff FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_admin'));

CREATE POLICY "Admins can delete staff"
  ON lab_staff FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'));

-- Update lab_services policies
DROP POLICY IF EXISTS "Admins can manage services" ON lab_services;

CREATE POLICY "Admins can insert services"
  ON lab_services FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_admin'));

CREATE POLICY "Admins can update services"
  ON lab_services FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'))
  WITH CHECK (public.get_user_role() IN ('super_admin', 'lab_admin'));

CREATE POLICY "Admins can delete services"
  ON lab_services FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('super_admin', 'lab_admin'));
