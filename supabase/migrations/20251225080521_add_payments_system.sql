/*
  # Payment System for Lab Orders

  ## Overview
  Implements a comprehensive payment tracking system for lab orders:
  - Record individual payments for orders
  - Support multiple payment methods
  - Track payment status (pending, partial, paid, overdue)
  - Calculate balances automatically
  - Multi-currency support (GTQ/USD)

  ## New Tables
  - `payments`: Records individual payment transactions
    - `id` (uuid, primary key)
    - `order_id` (uuid, references lab_orders)
    - `amount` (numeric, payment amount)
    - `currency` (text, GTQ or USD)
    - `payment_method` (text, cash/card/transfer/check)
    - `payment_date` (date, when payment was received)
    - `reference_number` (text, optional reference)
    - `notes` (text, optional notes)
    - `recorded_by` (uuid, who recorded the payment)
    - `created_at` (timestamptz)

  ## Modified Tables
  - `lab_orders`: Added payment tracking fields
    - `paid_amount` (numeric, total paid so far)
    - `payment_status` (text, pending/partial/paid/overdue)
    - `payment_due_date` (date, when payment is due)

  ## Security
  - RLS enabled on payments table
  - Lab staff can view all payments
  - Lab staff can record payments
  - Clinic users can view payments for their orders
  - Automatic calculation of paid_amount and payment_status
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency IN ('GTQ', 'USD')),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'check')),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text,
  notes text,
  recorded_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_orders' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE lab_orders ADD COLUMN paid_amount numeric DEFAULT 0 CHECK (paid_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE lab_orders ADD COLUMN payment_status text DEFAULT 'pending' 
      CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lab_orders' AND column_name = 'payment_due_date'
  ) THEN
    ALTER TABLE lab_orders ADD COLUMN payment_due_date date;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lab_orders_payment_status ON lab_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_payment_due_date ON lab_orders(payment_due_date);

CREATE POLICY "Lab staff can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Clinic users can view payments for their orders"
  ON payments FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT lo.id FROM lab_orders lo
      INNER JOIN profiles p ON p.clinic_id = lo.clinic_id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Lab staff can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role IN ('lab_admin', 'lab_staff')
    )
  );

CREATE POLICY "Lab admin can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role = 'lab_admin'
    )
  );

CREATE POLICY "Lab admin can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.global_role = 'lab_admin'
    )
  );

CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  order_price numeric;
  order_currency text;
  total_paid numeric;
BEGIN
  SELECT price, currency INTO order_price, order_currency
  FROM lab_orders
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  AND currency = order_currency;

  UPDATE lab_orders
  SET 
    paid_amount = total_paid,
    payment_status = CASE
      WHEN total_paid = 0 THEN 'pending'
      WHEN total_paid >= order_price THEN 'paid'
      ELSE 'partial'
    END
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_status_on_insert ON payments;
CREATE TRIGGER update_payment_status_on_insert
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_order_payment_status();

DROP TRIGGER IF EXISTS update_payment_status_on_update ON payments;
CREATE TRIGGER update_payment_status_on_update
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_order_payment_status();

DROP TRIGGER IF EXISTS update_payment_status_on_delete ON payments;
CREATE TRIGGER update_payment_status_on_delete
  AFTER DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_order_payment_status();
