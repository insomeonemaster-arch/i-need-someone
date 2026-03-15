import { useState } from 'react';
import { useAppMode } from '@/app/context/AppModeContext';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { providerService } from '@/services';
import { Card, CardContent } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
import { Button } from '@/app/components/ui/button';
import { User, Settings, HelpCircle, LogOut, Repeat, ChevronRight, Shield, Loader2, AlertCircle, Briefcase, DollarSign } from 'lucide-react';

export default function Profile() {
  const { mode, setMode } = useAppMode();
  const navigate = useNavigate();
  const { user, logout, switchMode, updateUser } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [becomingProvider, setBecomingProvider] = useState(false);
  const [becomeError, setBecomeError] = useState<string | null>(null);

  const handleModeToggle = async (checked: boolean) => {
    const newMode = checked ? 'provider' : 'client';
    setSwitching(true);
    setSwitchError(null);
    try {
      await switchMode(newMode);
      setMode(newMode);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to switch mode';
      setSwitchError(msg);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBecomeProvider = async () => {
    setBecomingProvider(true);
    setBecomeError(null);
    try {
      await providerService.createProfile({});
      updateUser({ ...user!, isProvider: true });
    } catch (err) {
      setBecomeError(err instanceof Error ? err.message : 'Failed to create provider profile');
    } finally {
      setBecomingProvider(false);
    }
  };

  const menuItems = [
    {
      title: 'Account Information',
      subtitle: 'Manage your personal details',
      route: '/profile/account',
      icon: User,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Settings',
      subtitle: 'Adjust your preferences',
      route: '/profile/settings',
      icon: Settings,
      color: 'bg-gray-50 text-gray-600',
    },
    {
      title: 'Earnings',
      subtitle: 'View your earnings and payouts',
      route: '/earnings',
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
      showForProvider: true,
    },
    {
      title: 'Verification Status',
      subtitle: 'View your verification status',
      route: '/verification/status',
      icon: Shield,
      color: 'bg-green-50 text-green-600',
      showForProvider: true,
    },
    {
      title: 'Help & Support',
      subtitle: 'Get assistance with your account',
      route: '/support',
      icon: HelpCircle,
      color: 'bg-[#4C9F9F]/10 text-[#4C9F9F]',
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.showForProvider || mode === 'provider'
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-[var(--brand-orange)] pt-6 pb-12 md:pb-16 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-white font-semibold text-lg md:text-xl">Profile</h1>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 md:px-4 py-1.5 md:py-2 min-h-[44px] flex items-center">
            <span className="text-white text-xs md:text-sm font-medium">
              {mode === 'client' ? 'Client Mode' : 'Provider Mode'}
            </span>
          </div>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-5">
              <div className="size-16 md:size-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="size-8 md:size-10 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-lg md:text-xl mb-0.5">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm md:text-base text-gray-600">{user?.email}</p>
              </div>
            </div>

            {/* Switch mode / Become a provider */}
            {user?.isProvider ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      {switching ? (
                        <Loader2 className="size-5 text-[var(--brand-orange)] animate-spin" />
                      ) : (
                        <Repeat className="size-5 text-[var(--brand-orange)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base">Switch Mode</p>
                      <p className="text-xs md:text-sm text-gray-600">
                        {mode === 'client' ? 'Switch to Provider' : 'Switch to Client'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={mode === 'provider'}
                    onCheckedChange={handleModeToggle}
                    disabled={switching}
                  />
                </div>
                {switchError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <span>{switchError}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      {becomingProvider ? (
                        <Loader2 className="size-5 text-[var(--brand-orange)] animate-spin" />
                      ) : (
                        <Briefcase className="size-5 text-[var(--brand-orange)]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base">Become a Provider</p>
                      <p className="text-xs md:text-sm text-gray-600">Offer services &amp; earn on INS</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleBecomeProvider}
                    disabled={becomingProvider}
                    className="bg-[var(--brand-orange)] hover:bg-[var(--brand-orange)]/90 text-white"
                  >
                    {becomingProvider ? 'Setting up...' : 'Get Started'}
                  </Button>
                </div>
                {becomeError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="size-4 flex-shrink-0" />
                    <span>{becomeError}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 -mt-6 pb-24 space-y-3">
        {filteredMenuItems.map((item) => (
          <Card
            key={item.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(item.route)}
          >
            <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
              <div className={`p-2.5 md:p-3 rounded-xl ${item.color}`}>
                <item.icon className="size-5 md:size-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm md:text-base">{item.title}</h3>
                <p className="text-xs md:text-sm text-gray-600">{item.subtitle}</p>
              </div>
              <ChevronRight className="size-5 text-gray-400" />
            </CardContent>
          </Card>
        ))}

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleLogout}>
          <CardContent className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 rounded-xl bg-red-50 text-red-600">
              <LogOut className="size-5 md:size-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm md:text-base text-red-600">Log Out</h3>
              <p className="text-xs md:text-sm text-gray-600">Sign out of your account</p>
            </div>
            <ChevronRight className="size-5 text-gray-400" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
