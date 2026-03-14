import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from './navigation/AppShell';

export function ProtectedAppShell() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}
