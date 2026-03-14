import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive container that centers content and applies max-width on larger screens
 * Mobile: Full width
 * Tablet: Max 834px centered
 * Desktop: Max 1024px centered
 */
export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`w-full mx-auto md:max-w-3xl lg:max-w-4xl ${className}`}>
      {children}
    </div>
  );
}

/**
 * Screen wrapper for full-height screens with responsive padding
 */
export function ResponsiveScreen({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      <ResponsiveContainer className="flex flex-col h-full">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
