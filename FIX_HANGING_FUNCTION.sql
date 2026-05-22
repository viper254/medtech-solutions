-- Fix the hanging get_site_status function
-- The issue is likely the check_auto_disable() call or the function logic

-- Drop and recreate with simpler logic
DROP FUNCTION IF EXISTS get_site_status();
DROP FUNCTION IF EXISTS check_auto_disable();

-- Simpler check_auto_disable that won't hang
CREATE OR REPLACE FUNCTION check_auto_disable()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  control_record RECORD;
  should_disable BOOLEAN;
  grace_end TIMESTAMPTZ;
BEGIN
  -- Get the control record
  SELECT * INTO control_record FROM site_control WHERE id = 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If auto-disable is not enabled, don't disable
  IF NOT control_record.auto_disable_on_overdue THEN
    RETURN false;
  END IF;
  
  -- Check if payment is overdue (past due date + grace period)
  IF control_record.payment_due_date IS NOT NULL THEN
    grace_end := control_record.payment_due_date + (control_record.grace_period_days || ' days')::INTERVAL;
    should_disable := NOW() > grace_end;
    
    -- Auto-disable if overdue
    IF should_disable AND control_record.is_active THEN
      UPDATE site_control SET is_active = false, updated_at = NOW() WHERE id = 1;
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Simpler get_site_status that won't hang
CREATE OR REPLACE FUNCTION get_site_status()
RETURNS TABLE (
  is_active BOOLEAN,
  customer_message TEXT,
  admin_message TEXT,
  days_until_due INTEGER,
  is_overdue BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  control_record RECORD;
  days_diff INTEGER;
BEGIN
  -- Check auto-disable first (but don't let it fail)
  BEGIN
    PERFORM check_auto_disable();
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors from check_auto_disable
    NULL;
  END;
  
  -- Get the control record
  SELECT * INTO control_record FROM site_control WHERE id = 1;
  
  -- If no record found, return safe defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, ''::TEXT, ''::TEXT, 999, false;
    RETURN;
  END IF;
  
  -- Calculate days until due
  IF control_record.payment_due_date IS NOT NULL THEN
    days_diff := EXTRACT(DAY FROM (control_record.payment_due_date - NOW()))::INTEGER;
  ELSE
    days_diff := 999;
  END IF;
  
  -- Return the status
  RETURN QUERY SELECT 
    control_record.is_active,
    control_record.customer_message,
    control_record.admin_message,
    days_diff,
    (control_record.payment_due_date IS NOT NULL AND NOW() > control_record.payment_due_date);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_site_status() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_auto_disable() TO anon, authenticated;
