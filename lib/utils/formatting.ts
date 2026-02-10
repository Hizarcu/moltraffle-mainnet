import { formatEther, formatUnits } from 'viem';
import { formatDistanceToNow, format, isPast, isFuture } from 'date-fns';

/**
 * Format wallet address to shortened version
 * @example formatAddress("0x1234...5678") => "0x1234...5678"
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format bigint ETH amount to readable string
 * @example formatEthAmount(1000000000000000000n) => "1.0 ETH"
 */
export function formatEthAmount(amount: bigint, decimals = 18, symbol = 'ETH'): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);

  // Format with appropriate decimal places
  if (num >= 1000) {
    return `${num.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`;
  } else if (num >= 1) {
    return `${num.toFixed(4)} ${symbol}`;
  } else if (num >= 0.0001) {
    return `${num.toFixed(6)} ${symbol}`;
  } else {
    return `${num.toExponential(2)} ${symbol}`;
  }
}

/**
 * Format date relative to now
 * @example formatRelativeTime(futureDate) => "in 2 days"
 */
export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format date to readable string
 * @example formatDate(date) => "Dec 25, 2023 at 12:00 PM"
 */
export function formatDate(date: Date): string {
  return format(date, 'MMM dd, yyyy \'at\' h:mm a');
}

/**
 * Format countdown timer
 * @example formatCountdown(futureDate) => "2d 5h 30m 15s"
 */
export function formatCountdown(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Ended';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate time remaining in seconds
 */
export function getTimeRemaining(targetDate: Date): number {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Check if date has passed
 */
export function hasDeadlinePassed(date: Date): boolean {
  return isPast(date);
}

/**
 * Check if date is in the future
 */
export function isUpcoming(date: Date): boolean {
  return isFuture(date);
}

/**
 * Format percentage
 * @example formatPercentage(75, 100) => "75%"
 */
export function formatPercentage(current: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (current / total) * 100;
  return `${Math.round(percentage)}%`;
}

/**
 * Format number with commas
 * @example formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get status badge color based on raffle status
 */
export function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'ended':
      return 'warning';
    case 'drawn':
      return 'info';
    case 'cancelled':
      return 'error';
    case 'upcoming':
      return 'default';
    default:
      return 'default';
  }
}
