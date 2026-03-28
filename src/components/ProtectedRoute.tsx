import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }
      // Check user is actually in the admins table
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();
      setAuthorized(!!data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!authorized) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
