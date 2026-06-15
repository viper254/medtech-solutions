-- Developer Control System for Site Management
-- This allows the developer to control site availability based on payment status

-- Table to store site status and payment information
CREATE TABLE IF NOT EXISTS site_control (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  payment_due_date TIMESTAMPTZ,
  grace_period_days INTEGER DEFAULT 3,
  last_payment_date TIMESTAMPTZ,
  next_payment_amount DECIMAL(10, 2) DEFAULT 0.00,
  customer_message TEXT DEFAULT 'Our store is temporarily unavailable. We''ll be back soon!',
  admin_message TEXT DEFAULT 'Payment is overdue. Please contact your developer.',
  auto_disable_on_overdue BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Table to track payment history
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'received',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial site control record (site active by default)
INSERT INTO site_control (id, is_active, payment_due_date, next_payment_amount)
VALUES (1, true, NOW() + INTERVAL '30 days', 5000.00)
ON CONFLICT (id) DO NOTHING;

-- Function to check if site should be disabled based on payment due date
CREATE OR REPLACE FUNCTION check_auto_disable()
RETURNS BOOLEAN AS $$
DECLARE
  control_record RECORD;
  should_disable BOOLEAN;
BEGIN
  SELECT * INTO control_record FROM site_control LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If auto-disable is not enabled, don't disable
  IF NOT control_record.auto_disable_on_overdue THEN
    RETURN false;
  END IF;
  
  -- Check if payment is overdue (past due date + grace period)
  IF control_record.payment_due_date IS NOT NULL THEN
    should_disable := NOW() > (control_record.payment_due_date + (control_record.grace_period_days || ' days')::INTERVAL);
    
    -- Auto-disable if overdue
    IF should_disable AND control_record.is_active THEN
      UPDATE site_control SET is_active = false, updated_at = NOW();
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current site status (called by frontend)
CREATE OR REPLACE FUNCTION get_site_status()
RETURNS TABLE (
  is_active BOOLEAN,
  customer_message TEXT,
  admin_message TEXT,
  days_until_due INTEGER,
  is_overdue BOOLEAN
) AS $$
DECLARE
  control_record RECORD;
  days_diff INTEGER;
BEGIN
  -- Check auto-disable first
  PERFORM check_auto_disable();
  
  SELECT * INTO control_record FROM site_control LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, ''::TEXT, ''::TEXT, 999, false;
    RETURN;
  END IF;
  
  -- Calculate days until due
  IF control_record.payment_due_date IS NOT NULL THEN
    days_diff := EXTRACT(DAY FROM (control_record.payment_due_date - NOW()));
  ELSE
    days_diff := 999;
  END IF;
  
  RETURN QUERY SELECT 
    control_record.is_active,
    control_record.customer_message,
    control_record.admin_message,
    days_diff,
    (control_record.payment_due_date IS NOT NULL AND NOW() > control_record.payment_due_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies: Allow authenticated users to access (for control panel)
ALTER TABLE site_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write site_control (for control panel)
CREATE POLICY "Allow authenticated access to site_control" ON site_control FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to read/write payment_history (for control panel)
CREATE POLICY "Allow authenticated access to payment_history" ON payment_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant execute permissions on the status function to public (read-only)
GRANT EXECUTE ON FUNCTION get_site_status() TO anon, authenticated;

-- Comment for documentation
COMMENT ON TABLE site_control IS 'Developer-controlled site availability and payment tracking. Access only through secure functions.';
COMMENT ON TABLE payment_history IS 'Payment history log. Access restricted to developer control panel.';
