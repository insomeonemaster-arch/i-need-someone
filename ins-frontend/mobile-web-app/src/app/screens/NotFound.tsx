import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900">Page Not Found</h2>
        <p className="text-gray-600">
          The page you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => navigate('/')}
          className="mt-6"
        >
          <Home className="size-4 mr-2" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
