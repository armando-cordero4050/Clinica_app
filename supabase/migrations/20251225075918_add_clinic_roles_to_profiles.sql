/*
  # Add Clinic Roles to Profiles

  ## Overview
  Adds clinic roles to the global_role check constraint:
  - clinic_admin: Can manage their clinic and staff
  - clinic_staff: Can create orders for their clinic

  ## Changes
  - Updates global_role check constraint to include new roles
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_global_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_global_role_check
  CHECK (global_role = ANY (ARRAY[
    'super_admin'::text,
    'lab_admin'::text,
    'lab_staff'::text,
    'clinic_admin'::text,
    'clinic_staff'::text
  ]));
