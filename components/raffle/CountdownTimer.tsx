'use client';

import { useState, useEffect } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils/cn';

interface CountdownTimerProps {
  deadline: Date;
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({ deadline, className, onExpire }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const { formattedTime, isExpired } = useCountdown(deadline);

  // Only render countdown after client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Call onExpire callback when timer expires
  if (isExpired && onExpire) {
    onExpire();
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span
        className={cn(
          'font-mono font-semibold',
          isExpired ? 'text-semantic-error' : 'text-text-primary'
        )}
        suppressHydrationWarning
      >
        {mounted ? formattedTime : 'Loading...'}
      </span>
    </div>
  );
}
