import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SiteStatus {
  is_active: boolean;
  customer_message: string;
  admin_message: string;
  days_until_due: number;
  is_overdue: boolean;
}

export function useSiteStatus() {
  const [status, setStatus] = useState<SiteStatus>({
    is_active: true,
    customer_message: '',
    admin_message: '',
    days_until_due: 999,
    is_overdue: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Check status every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      const { data, error } = await supabase.rpc('get_site_status');
      
      if (error) {
        console.warn('Site status check failed (using defaults):', error.message);
        return;
      }
      
      if (data && data.length > 0) {
        setStatus(data[0] as SiteStatus);
      }
    } catch (error) {
      console.warn('Site status check error (using defaults):', error);
    } finally {
      setLoading(false);
    }
  }

  return { status, loading, refresh: checkStatus };
}
