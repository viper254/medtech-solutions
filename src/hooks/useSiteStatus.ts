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
  const [status, setStatus] = useState<SiteStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
        console.warn('Site status check failed (site will remain active):', error.message);
        // Set to null so site stays active by default
        setStatus(null);
        return;
      }
      
      if (data && data.length > 0) {
        setStatus(data[0] as SiteStatus);
      } else {
        // No data means site stays active
        setStatus(null);
      }
    } catch (error) {
      console.warn('Site status check error (site will remain active):', error);
      // On any error, site stays active
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return { status, loading, refresh: checkStatus };
}
