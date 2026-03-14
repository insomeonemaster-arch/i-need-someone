import { useAppMode } from '@/app/context/AppModeContext';
import { useINS } from '@/app/context/INSContext';
import { useLocation, useNavigate } from 'react-router';
import { Home, FileText, MessageCircle, User, Briefcase, DollarSign } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';

export function BottomNav() {
  const { mode } = useAppMode();
  const { openINS } = useINS();
  const location = useLocation();
  const navigate = useNavigate();

  const clientNav = [
    { icon: Home, label: 'Home', path: '/', active: location.pathname === '/' },
    { icon: FileText, label: 'My Requests', path: '/my-requests', active: location.pathname.startsWith('/my-requests') },
    { icon: null, label: 'INS', path: '', isCenter: true, active: false },
    { icon: MessageCircle, label: 'Messages', path: '/messages', active: location.pathname.startsWith('/messages'), badge: true },
    { icon: User, label: 'Profile', path: '/profile', active: location.pathname.startsWith('/profile') },
  ];

  const providerNav = [
    { icon: Home, label: 'Home', path: '/', active: location.pathname === '/' },
    { icon: Briefcase, label: 'My Jobs', path: '/my-jobs', active: location.pathname.startsWith('/my-jobs') },
    { icon: null, label: 'INS', path: '', isCenter: true, active: false },
    { icon: DollarSign, label: 'Earnings', path: '/earnings', active: location.pathname.startsWith('/earnings') },
    { icon: User, label: 'Profile', path: '/profile', active: location.pathname.startsWith('/profile') },
  ];

  const navItems = mode === 'client' ? clientNav : providerNav;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40">
      {/* Responsive max-width container to match main content */}
      <div className="mx-auto w-full md:max-w-3xl lg:max-w-4xl">
        <nav className="flex items-center justify-around px-2 md:px-4 h-16 md:h-18">
          {navItems.map((item, index) => {
            if (item.isCenter) {
              return (
                <button
                  key={item.label}
                  onClick={openINS}
                  className="flex flex-col items-center justify-center -mt-6 md:-mt-8 min-w-[44px] min-h-[44px]"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[var(--brand-orange)] flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white flex items-center justify-center">
                      <span className="text-xs md:text-sm font-bold text-[var(--brand-orange)]">
                        INS
                      </span>
                    </div>
                  </div>
                </button>
              );
            }

            const Icon = item.icon!;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 px-2 md:px-3 py-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] ${
                  item.active ? 'text-[var(--brand-orange)]' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`size-6 md:size-7 ${item.active ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--brand-orange)] rounded-full" />
                  )}
                </div>
                <span className={`text-xs md:text-sm ${item.active ? '' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}