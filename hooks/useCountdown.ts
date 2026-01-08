import { useState, useEffect } from 'react';
import { getTimeRemaining, formatCountdown } from '@/lib/utils/formatting';

/**
 * Hook to manage countdown timer
 */
export function useCountdown(targetDate: Date) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(targetDate));
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Initial check
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

  return {
    timeRemaining,
    isExpired,
    formattedTime: formatCountdown(targetDate),
  };
}
