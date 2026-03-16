import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAdmin?: boolean;
}

/**
 * ProtectedRoute component that verifies user is authenticated and optionally is admin
 * Redirects to /login if not authenticated or not admin
 */
export function ProtectedRoute({ children, requiredAdmin = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#5B7CFA]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredAdmin && !user.isAdmin) {
    console.warn('[ProtectedRoute] User is not admin, access denied');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
