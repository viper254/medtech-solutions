import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!authenticated) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
