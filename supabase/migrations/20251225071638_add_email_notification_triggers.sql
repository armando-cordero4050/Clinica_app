/*
  # Add Email Notification Triggers

  ## Overview
  Configures automatic email notifications for orders using Supabase Edge Functions.

  ## Changes
  1. Create function to send confirmation email when order is created
  2. Create function to send notification to lab when order is created
  3. Create function to notify doctor when order is ready for delivery
  4. Create triggers to call edge functions automatically

  ## Security
  - Functions use service role for invoking edge functions
  - No direct email credentials exposed in database
*/

-- Enable http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http;

-- Function to send order confirmation email to doctor
CREATE OR REPLACE FUNCTION send_order_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
  teeth_array text[];
  function_url text;
  payload jsonb;
BEGIN
  -- Get teeth selections for this order
  SELECT array_agg(tooth_number || ' (' || condition_type || ')')
  INTO teeth_array
  FROM odontogram_selections
  WHERE order_id = NEW.id;

  -- Get Supabase URL from environment
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-order-confirmation';

  -- Build payload
  payload := jsonb_build_object(
    'order_number', NEW.order_number,
    'clinic_name', NEW.clinic_name,
    'doctor_name', NEW.doctor_name,
    'doctor_email', NEW.doctor_email,
    'patient_name', NEW.patient_name,
    'service_name', NEW.service_name,
    'price', NEW.price,
    'currency', NEW.currency,
    'due_date', NEW.due_date,
    'teeth_selected', COALESCE(teeth_array, ARRAY[]::text[])
  );

  -- Call edge function asynchronously (fire and forget)
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify lab about new order
CREATE OR REPLACE FUNCTION notify_lab_new_order()
RETURNS TRIGGER AS $$
DECLARE
  teeth_array text[];
  function_url text;
  payload jsonb;
BEGIN
  -- Get teeth selections for this order
  SELECT array_agg(tooth_number || ' (' || condition_type || ')')
  INTO teeth_array
  FROM odontogram_selections
  WHERE order_id = NEW.id;

  -- Get Supabase URL from environment
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-lab-new-order';

  -- Build payload
  payload := jsonb_build_object(
    'order_number', NEW.order_number,
    'clinic_name', NEW.clinic_name,
    'doctor_name', NEW.doctor_name,
    'doctor_email', NEW.doctor_email,
    'patient_name', NEW.patient_name,
    'service_name', NEW.service_name,
    'price', NEW.price,
    'currency', NEW.currency,
    'due_date', NEW.due_date,
    'teeth_selected', COALESCE(teeth_array, ARRAY[]::text[]),
    'diagnosis', NEW.diagnosis
  );

  -- Call edge function asynchronously
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify doctor when order is ready
CREATE OR REPLACE FUNCTION notify_order_ready()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
  payload jsonb;
BEGIN
  -- Only send notification when status changes to ready_delivery
  IF NEW.status = 'ready_delivery' AND OLD.status != 'ready_delivery' THEN
    -- Get Supabase URL from environment
    function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-order-ready';

    -- Build payload
    payload := jsonb_build_object(
      'order_number', NEW.order_number,
      'clinic_name', NEW.clinic_name,
      'doctor_name', NEW.doctor_name,
      'doctor_email', NEW.doctor_email,
      'patient_name', NEW.patient_name,
      'service_name', NEW.service_name,
      'price', NEW.price,
      'currency', NEW.currency
    );

    -- Call edge function asynchronously
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := payload
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_send_order_confirmation ON lab_orders;
DROP TRIGGER IF EXISTS trigger_notify_lab_new_order ON lab_orders;
DROP TRIGGER IF EXISTS trigger_notify_order_ready ON lab_orders;

-- Create trigger for order confirmation email (after insert)
CREATE TRIGGER trigger_send_order_confirmation
  AFTER INSERT ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION send_order_confirmation_email();

-- Create trigger for lab notification (after insert)
CREATE TRIGGER trigger_notify_lab_new_order
  AFTER INSERT ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_lab_new_order();

-- Create trigger for order ready notification (after update)
CREATE TRIGGER trigger_notify_order_ready
  AFTER UPDATE ON lab_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_ready();
