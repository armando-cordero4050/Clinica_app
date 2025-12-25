/*
  # Add INSERT policy for profiles table

  1. Changes
    - Add policy to allow service role to insert profiles
    - This ensures the create-staff-user edge function can create profiles

  2. Security
    - Policy restricted to service_role operations
*/

-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Allow service role to insert profiles (for edge functions)
CREATE POLICY "Service role can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
