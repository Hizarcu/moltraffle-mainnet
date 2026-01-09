import { Raffle } from '@/lib/types/raffle';
import { RaffleCard } from './RaffleCard';
import { cn } from '@/lib/utils/cn';

interface RaffleGridProps {
  raffles: Raffle[];
  className?: string;
  emptyMessage?: string;
}

export function RaffleGrid({ raffles, className, emptyMessage = 'No raffles found' }: RaffleGridProps) {
  if (raffles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      className
    )}>
      {raffles.map((raffle) => (
        <RaffleCard key={raffle.id} raffle={raffle} />
      ))}
    </div>
  );
}
