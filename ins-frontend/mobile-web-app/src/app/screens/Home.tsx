import { useAppMode } from '@/app/context/AppModeContext';
import ClientHome from './ClientHome';
import ProviderHome from './ProviderHome';

export default function Home() {
  const { mode } = useAppMode();
  
  return mode === 'client' ? <ClientHome /> : <ProviderHome />;
}
