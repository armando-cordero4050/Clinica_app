/*
  # Seed Initial Data for DentalFlow
  
  ## What This Migration Does
  Populates the database with initial configuration data:
  
  1. **Laboratory**
     - Name: DentalFlow Lab Guatemala
     - Country: Guatemala (GT)
     - Currency: GTQ (primary), USD (allowed)
     - Tax rate: 12% (IVA Guatemala)
  
  2. **Lab Staff Roles** (6 roles)
     - Administrador Global
     - Jefe de Laboratorio
     - Diseño
     - Fabricación
     - Control de Calidad
     - Entrega/Venta
  
  3. **Initial Services** (5 services)
     - Corona de Porcelana - Q1,200.00 (5 días)
     - Corona de Zirconio - Q1,600.00 (6 días)
     - Prótesis Removible Acrílica - Q2,500.00 (8 días)
     - Implante Dental - Q3,800.00 (10 días)
     - Guarda Oclusal - Q750.00 (3 días)
  
  ## Notes
  - Uses idempotent inserts (ON CONFLICT DO NOTHING)
  - USD prices calculated at ~Q7.80 exchange rate
  - Laboratory ID is stored for reference
*/

DO $$
DECLARE
  lab_id uuid;
  role_admin_global uuid;
  role_jefe_lab uuid;
  role_diseno uuid;
  role_fabricacion uuid;
  role_control_calidad uuid;
  role_entrega uuid;
BEGIN
  
  -- Insert Laboratory (only if doesn't exist)
  INSERT INTO laboratories (
    name,
    country,
    phone,
    address,
    tax_id,
    tax_rate,
    default_currency,
    allowed_currencies
  ) VALUES (
    'DentalFlow Lab Guatemala',
    'GT',
    '+502 5555-5555',
    'Ciudad de Guatemala, Guatemala',
    'CF',
    0.12,
    'GTQ',
    ARRAY['GTQ', 'USD']
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO lab_id;
  
  -- If laboratory already exists, get its ID
  IF lab_id IS NULL THEN
    SELECT id INTO lab_id FROM laboratories LIMIT 1;
  END IF;
  
  -- Insert Lab Staff Roles
  INSERT INTO lab_staff_roles (name, description, color, display_order)
  VALUES
    ('Administrador Global', 'Acceso completo al sistema', '#8B5CF6', 1),
    ('Jefe de Laboratorio', 'Supervisión y coordinación general', '#3B82F6', 2),
    ('Diseño', 'Diseño CAD/CAM de prótesis', '#10B981', 3),
    ('Fabricación', 'Fabricación y manufactura', '#F59E0B', 4),
    ('Control de Calidad', 'Inspección y validación final', '#EF4444', 5),
    ('Entrega/Venta', 'Contacto con doctores y entrega', '#06B6D4', 6)
  ON CONFLICT (name) DO NOTHING;
  
  -- Get role IDs for later use
  SELECT id INTO role_admin_global FROM lab_staff_roles WHERE name = 'Administrador Global';
  SELECT id INTO role_jefe_lab FROM lab_staff_roles WHERE name = 'Jefe de Laboratorio';
  SELECT id INTO role_diseno FROM lab_staff_roles WHERE name = 'Diseño';
  SELECT id INTO role_fabricacion FROM lab_staff_roles WHERE name = 'Fabricación';
  SELECT id INTO role_control_calidad FROM lab_staff_roles WHERE name = 'Control de Calidad';
  SELECT id INTO role_entrega FROM lab_staff_roles WHERE name = 'Entrega/Venta';
  
  -- Insert Lab Services
  INSERT INTO lab_services (
    laboratory_id,
    name,
    description,
    category,
    price_gtq,
    price_usd,
    turnaround_days,
    active
  ) VALUES
    (
      lab_id,
      'Corona de Porcelana',
      'Corona dental de porcelana de alta calidad',
      'Prótesis Fija',
      1200.00,
      153.85,  -- ~$154 USD
      5,
      true
    ),
    (
      lab_id,
      'Corona de Zirconio',
      'Corona dental de zirconio premium',
      'Prótesis Fija',
      1600.00,
      205.13,  -- ~$205 USD
      6,
      true
    ),
    (
      lab_id,
      'Prótesis Removible Acrílica',
      'Prótesis dental removible en acrílico',
      'Prótesis Removible',
      2500.00,
      320.51,  -- ~$321 USD
      8,
      true
    ),
    (
      lab_id,
      'Implante Dental (Fabricación)',
      'Fabricación de corona sobre implante',
      'Implantología',
      3800.00,
      487.18,  -- ~$487 USD
      10,
      true
    ),
    (
      lab_id,
      'Guarda Oclusal',
      'Guarda dental para bruxismo',
      'Ortodoncia',
      750.00,
      96.15,   -- ~$96 USD
      3,
      true
    )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Seed data inserted successfully';
  RAISE NOTICE 'Laboratory ID: %', lab_id;
  
END $$;
