import { RouterProvider } from 'react-router';
import { AppModeProvider } from './context/AppModeContext';
import { INSProvider } from './context/INSContext';
import { AuthProvider } from '../context/AuthContext';
import { router } from './routes.tsx';

export default function App() {
  return (
    <AuthProvider>
      <AppModeProvider>
        <INSProvider>
          <RouterProvider router={router} />
        </INSProvider>
      </AppModeProvider>
    </AuthProvider>
  );
}