import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * Hook that ensures current user is admin, redirects to login if not
 */
export function useRequireAdmin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!user || !user.isAdmin) {
      console.warn('[Auth] User is not admin, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  return { user, loading, isAdmin: !!user?.isAdmin };
}
