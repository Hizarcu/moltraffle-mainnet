import { useState, useEffect, useMemo } from 'react';
import { getTimeRemaining, formatCountdown } from '@/lib/utils/formatting';

/**
 * Hook to manage countdown timer
 * Note: Initial state uses null to avoid hydration mismatch
 */
export function useCountdown(targetDate: Date) {
  // Initialize with null to avoid server/client mismatch
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initial check only on client
    const remaining = getTimeRemaining(targetDate);
    setTimeRemaining(remaining);
    setIsExpired(remaining === 0);

    // Update every second
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(targetDate);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Only calculate formatted time on client
  const formattedTime = useMemo(() => {
    if (!mounted) return 'Loading...';
    return formatCountdown(targetDate);
  }, [targetDate, mounted, timeRemaining]); // timeRemaining triggers recalculation

  return {
    timeRemaining: timeRemaining ?? 0,
    isExpired,
    formattedTime,
  };
}
