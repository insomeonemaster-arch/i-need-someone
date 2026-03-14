import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';
import INSModal from '../ins/INSModal';
import { useAppMode } from '@/app/context/AppModeContext';

export function AppShell() {
  const { mode } = useAppMode();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Main content with responsive max-width */}
      <main className="flex-1 overflow-hidden relative mx-auto w-full md:max-w-3xl lg:max-w-4xl bg-white md:shadow-lg">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* INS Modal - Portal Layer */}
      <INSModal />
    </div>
  );
}