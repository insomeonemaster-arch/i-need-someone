import { useNavigate } from 'react-router';
import { ArrowLeft, MessageCircle, DollarSign, Shield, UserX, HelpCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';

const supportOptions = [
  {
    title: 'Report a Problem',
    description: 'Technical issues, bugs, or errors',
    icon: MessageCircle,
    color: 'bg-red-50 text-red-600',
    route: '/support/create?category=problem',
  },
  {
    title: 'Payment Issue',
    description: 'Billing, refunds, or transaction problems',
    icon: DollarSign,
    color: 'bg-green-50 text-green-600',
    route: '/support/create?category=payment',
  },
  {
    title: 'Safety Issue',
    description: 'Security concerns or unsafe behavior',
    icon: Shield,
    color: 'bg-[#4C9F9F]/10 text-[#4C9F9F]',
    route: '/support/create?category=safety',
  },
  {
    title: 'Account Issue',
    description: 'Login, profile, or account settings',
    icon: UserX,
    color: 'bg-purple-50 text-purple-600',
    route: '/support/create?category=account',
  },
  {
    title: 'Contact Support',
    description: 'General inquiries and assistance',
    icon: HelpCircle,
    color: 'bg-blue-50 text-blue-600',
    route: '/support/create?category=general',
  },
];

export default function SupportHub() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/profile')} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-semibold">Help & Support</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-4">
        {/* My Tickets Card */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 border-[var(--brand-orange)]"
          onClick={() => navigate('/support/tickets')}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">My Support Tickets</h3>
              <p className="text-sm text-gray-600">View your open and resolved tickets</p>
            </div>
            <ChevronRight className="size-5 text-gray-400" />
          </CardContent>
        </Card>

        {/* Support Options */}
        <div>
          <h2 className="font-semibold mb-3 px-1">How can we help?</h2>
          <div className="space-y-3">
            {supportOptions.map((option) => (
              <Card
                key={option.title}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(option.route)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${option.color}`}>
                    <option.icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium mb-0.5">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  <ChevronRight className="size-5 text-gray-400" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}