/*
  # Add Order Attachments Support

  ## Overview
  This migration adds support for file attachments on orders, including:
  - Storage bucket configuration for order files
  - Table for tracking uploaded files
  - RLS policies for secure file access

  ## New Tables
  - `order_attachments`: Tracks files attached to orders
    - `id` (uuid, primary key)
    - `order_id` (uuid, references lab_orders)
    - `file_name` (text, original filename)
    - `file_path` (text, path in storage bucket)
    - `file_size` (bigint, size in bytes)
    - `file_type` (text, MIME type)
    - `uploaded_by_email` (text, email of uploader for public uploads)
    - `uploaded_by_user` (uuid, references profiles for authenticated uploads)
    - `created_at` (timestamptz)

  ## Storage
  - Creates bucket `order-files` with public read access
  - Supports images (jpg, png, pdf), PDFs, and STL files
  - Max file size: 10MB

  ## Security
  - RLS enabled on order_attachments
  - Public can upload files (for dentist form)
  - Lab staff can view all attachments
  - Lab staff can delete attachments
*/

CREATE TABLE IF NOT EXISTS order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  uploaded_by_email text,
  uploaded_by_user uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_attachments_order_id ON order_attachments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_attachments_created_at ON order_attachments(created_at DESC);

ALTER TABLE order_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert attachments"
  ON order_attachments FOR INSERT
  WITH CHECK (true);

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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'model/stl',
    'application/sla'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can upload order files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'order-files');

CREATE POLICY "Public can read order files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'order-files');

CREATE POLICY "Lab staff can delete order files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'order-files'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );
