import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Wrench, Briefcase, Rocket, Bell } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { INSIntakeModal } from '@/app/components/ins/INSIntakeModal';

export default function ProviderHome() {
  const navigate = useNavigate();
  const [insConfig, setInsConfig] = useState<{
    isOpen: boolean;
    category: 'local-services' | 'jobs' | 'projects';
  } | null>(null);

  const cards = [
    {
      title: 'Local Service Providers',
      description: 'Offer local services (handyman, plumber…)',
      icon: Wrench,
      color: 'bg-blue-50 text-blue-600',
      category: 'local-services' as const,
      manualRoute: '/local-services/provider/setup',
    },
    {
      title: 'Jobs',
      description: 'Find your next job',
      icon: Briefcase,
      color: 'bg-green-50 text-green-600',
      category: 'jobs' as const,
      manualRoute: '/jobs/candidate/browse',
    },
    {
      title: 'Projects',
      description: 'Offer your talent remotely',
      icon: Rocket,
      color: 'bg-purple-50 text-purple-600',
      category: 'projects' as const,
      manualRoute: '/projects/provider/setup',
    },
  ];

  return (
    <>
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl md:text-3xl">Ready to earn</h1>
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center relative"
            >
              <Bell className="size-6" />
              {/* Notification badge */}
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-600 rounded-full"></span>
            </button>
          </div>
          <p className="text-gray-600 text-sm md:text-base">Choose how you want to work</p>
        </div>

        <div className="flex-1 px-4 md:px-6 lg:px-8 pb-24 space-y-3 md:space-y-4">
          {cards.map((card) => (
            <Card
              key={card.title}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setInsConfig({ isOpen: true, category: card.category })}
            >
              <CardContent className="p-5 md:p-6 flex items-start gap-4">
                <div className={`p-3 md:p-4 rounded-xl ${card.color}`}>
                  <card.icon className="size-6 md:size-7" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-base md:text-lg">{card.title}</h3>
                  <p className="text-sm md:text-base text-gray-600">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* INS Intake Modal */}
      {insConfig && (
        <INSIntakeModal
          isOpen={insConfig.isOpen}
          onClose={() => setInsConfig(null)}
          category={insConfig.category}
          mode="provider"
          onComplete={(data) => {
            navigate('/review-edit', {
              state: {
                collectedData: data,
                category: insConfig.category,
                mode: 'provider',
              },
            });
            setInsConfig(null);
          }}
          onManualFallback={() => {
            const card = cards.find((c) => c.category === insConfig.category);
            if (card) {
              navigate(card.manualRoute);
            }
            setInsConfig(null);
          }}
        />
      )}
    </>
  );
}