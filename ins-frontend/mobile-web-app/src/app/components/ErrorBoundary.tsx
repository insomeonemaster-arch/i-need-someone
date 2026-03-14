import { useEffect } from 'react';
import { useNavigate, useRouteError } from 'react-router';

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to home on route errors
    console.error('Route error:', error);
    navigate('/', { replace: true });
  }, [error, navigate]);

  return null;
}
