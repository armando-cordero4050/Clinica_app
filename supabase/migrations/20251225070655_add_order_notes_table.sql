/*
  # Add Order Notes Table

  ## Overview
  Adds support for internal notes on lab orders that can be created by staff members.

  ## New Tables
  1. `order_notes`
    - `id` (uuid, primary key)
    - `order_id` (uuid, foreign key to lab_orders)
    - `user_id` (uuid, foreign key to profiles)
    - `note` (text, required)
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on order_notes table
  - Lab staff can view notes for any order
  - Lab staff can create notes
  - Only note creator can update/delete their own notes
*/

-- Create order_notes table
CREATE TABLE IF NOT EXISTS order_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

-- Policies: Lab staff can view all notes
CREATE POLICY "Lab staff can view order notes"
  ON order_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Policies: Lab staff can create notes
CREATE POLICY "Lab staff can create order notes"
  ON order_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Policies: Users can update their own notes
CREATE POLICY "Users can update own notes"
  ON order_notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies: Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON order_notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_created_at ON order_notes(created_at DESC);
