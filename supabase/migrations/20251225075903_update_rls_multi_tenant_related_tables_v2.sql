/*
  # Update RLS for Multi-Tenant Support - Related Tables

  ## Overview
  Updates RLS policies for tables related to orders to support multi-tenant:
  - odontogram_selections
  - order_notes
  - order_attachments
  - order_status_history

  ## Security Changes
  - Clinic users can only access data for their clinic's orders
  - Lab staff can access all data
  - Proper isolation based on order's clinic_id
*/

DROP POLICY IF EXISTS "Lab staff can view all selections" ON odontogram_selections;
DROP POLICY IF EXISTS "Lab staff can insert selections" ON odontogram_selections;

CREATE POLICY "Lab staff can view all selections"
  ON odontogram_selections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Clinic users can view their clinic selections"
  ON odontogram_selections FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT lo.id FROM lab_orders lo
      INNER JOIN profiles p ON p.clinic_id = lo.clinic_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Clinic users can insert selections for their orders"
  ON odontogram_selections FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT lo.id FROM lab_orders lo
      INNER JOIN profiles p ON p.clinic_id = lo.clinic_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Lab staff can insert selections"
  ON odontogram_selections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

DROP POLICY IF EXISTS "Lab staff can view all notes" ON order_notes;
DROP POLICY IF EXISTS "Lab staff can insert notes" ON order_notes;
DROP POLICY IF EXISTS "Lab staff can update their own notes" ON order_notes;
DROP POLICY IF EXISTS "Lab staff can delete their own notes" ON order_notes;

CREATE POLICY "Lab staff can view all notes"
  ON order_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Clinic users can view notes for their clinic orders"
  ON order_notes FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT lo.id FROM lab_orders lo
      INNER JOIN profiles p ON p.clinic_id = lo.clinic_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Lab staff can insert notes"
  ON order_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Clinic users can insert notes for their orders"
  ON order_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT lo.id FROM lab_orders lo
      INNER JOIN profiles p ON p.clinic_id = lo.clinic_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Lab staff can update their own notes"
  ON order_notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Lab staff can delete their own notes"
  ON order_notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Lab staff can view all attachments" ON order_attachments;
DROP POLICY IF EXISTS "Lab staff can delete attachments" ON order_attachments;

CREATE POLICY "Lab staff can view all attachments"
  ON order_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Clinic users can view their clinic attachments"
  ON order_attachments FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT lo.id FROM lab_orders lo
      INNER JOIN profiles p ON p.clinic_id = lo.clinic_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Lab staff can delete attachments"
  ON order_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

DROP POLICY IF EXISTS "Lab staff can view order history" ON order_status_history;

CREATE POLICY "Lab staff can view all order history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Clinic users can view their clinic order history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT lo.id FROM lab_orders lo
      INNER JOIN profiles p ON p.clinic_id = lo.clinic_id
      WHERE p.id = auth.uid()
    )
  );
