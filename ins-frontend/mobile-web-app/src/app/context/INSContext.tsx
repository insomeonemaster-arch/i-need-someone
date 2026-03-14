import React, { createContext, useContext, useState, useEffect } from 'react';

interface INSContextType {
  isINSOpen: boolean;
  openINS: () => void;
  closeINS: () => void;
}

const INSContext = createContext<INSContextType | undefined>(undefined);

export function INSProvider({ children }: { children: React.ReactNode }) {
  const [isINSOpen, setIsINSOpen] = useState(false);

  const openINS = () => setIsINSOpen(true);
  const closeINS = () => setIsINSOpen(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isINSOpen) {
        closeINS();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isINSOpen]);

  // Handle Android back button
  useEffect(() => {
    const handlePopState = () => {
      if (isINSOpen) {
        closeINS();
        window.history.pushState(null, '', window.location.href);
      }
    };

    if (isINSOpen) {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isINSOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isINSOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isINSOpen]);

  return (
    <INSContext.Provider value={{ isINSOpen, openINS, closeINS }}>
      {children}
    </INSContext.Provider>
  );
}

export function useINS() {
  const context = useContext(INSContext);
  if (context === undefined) {
    throw new Error('useINS must be used within an INSProvider');
  }
  return context;
}
