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
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Status check timeout')), 5000)
      );
      
      const statusPromise = supabase.rpc('get_site_status');
      
      const { data, error } = await Promise.race([statusPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('Failed to check site status:', error);
        // If function doesn't exist or fails, assume site is active
        setStatus({
          is_active: true,
          customer_message: '',
          admin_message: '',
          days_until_due: 999,
          is_overdue: false,
        });
      } else if (data && data.length > 0) {
        setStatus(data[0] as SiteStatus);
      } else {
        // No data returned, assume active
        setStatus({
          is_active: true,
          customer_message: '',
          admin_message: '',
          days_until_due: 999,
          is_overdue: false,
        });
      }
    } catch (error) {
      console.error('Site status check error:', error);
      // Fail open - allow site to work if check fails
      setStatus({
        is_active: true,
        customer_message: '',
        admin_message: '',
        days_until_due: 999,
        is_overdue: false,
      });
    } finally {
      setLoading(false);
    }
  }

  return { status, loading, refresh: checkStatus };
}
