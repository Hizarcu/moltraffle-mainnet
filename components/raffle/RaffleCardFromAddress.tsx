'use client';

import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { useRaffleDetails } from '@/lib/contracts/hooks/useAllRaffles';
import Link from 'next/link';

interface RaffleCardFromAddressProps {
  raffleAddress: string;
  userAddress?: string;
  showOnlyIfParticipating?: boolean;
  filterStatus?: 'all' | 'active' | 'ended' | 'completed';
}

export function RaffleCardFromAddress({ raffleAddress, userAddress, showOnlyIfParticipating = false, filterStatus = 'all' }: RaffleCardFromAddressProps) {
  const { raffle, isLoading } = useRaffleDetails(raffleAddress);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    );
  }

  if (!raffle) {
    return null;
  }

  // Check if user is participating in this raffle
  const isParticipating = userAddress && raffle.participants.some(
    p => p.toLowerCase() === userAddress.toLowerCase()
  );

  // If showOnlyIfParticipating is true and user is not participating, don't render
  if (showOnlyIfParticipating && !isParticipating) {
    return null;
  }

  // Filter by status if specified
  if (filterStatus !== 'all') {
    const status = raffle.status;
    const isActive = (typeof status === 'number' && status === 0) || status === 'active';
    const isEnded = (typeof status === 'number' && status === 1) || status === 'ended';
    const isCompleted = (typeof status === 'number' && (status === 2 || status === 4)) || status === 'drawn' || status === 'cancelled';

    if (filterStatus === 'active' && !isActive) {
      return null;
    }
    if (filterStatus === 'ended' && !isEnded) {
      return null;
    }
    if (filterStatus === 'completed' && !isCompleted) {
      return null;
    }
  }

  const getStatusColor = (status: number | string) => {
    const s = typeof status === 'string' ? status : status;
    if (s === 0 || s === 'active') return 'bg-green-500/20 text-green-400'; // ACTIVE
    if (s === 1 || s === 'ended') return 'bg-yellow-500/20 text-yellow-400'; // ENDED
    if (s === 2 || s === 'drawn') return 'bg-purple-500/20 text-purple-400'; // DRAWN
    if (s === 4 || s === 'cancelled') return 'bg-blue-500/20 text-blue-400'; // COMPLETED (prize claimed)
    return 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status: number | string) => {
    const s = typeof status === 'string' ? status : status;
    if (s === 0 || s === 'active') return 'Active';
    if (s === 1 || s === 'ended') return 'Ended';
    if (s === 2 || s === 'drawn') return 'Drawn';
    if (s === 4 || s === 'cancelled') return 'Completed';
    return 'Unknown';
  };

  const isWinner = raffle.winner && userAddress &&
                   raffle.winner.toLowerCase() === userAddress.toLowerCase();

  return (
    <Card className="p-6 hover:border-purple-500/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-lg">{raffle.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(raffle.status as unknown as number)}`}>
          {getStatusLabel(raffle.status as unknown as number)}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {raffle.description}
      </p>

      {isParticipating && !isWinner && (
        <div className="mb-4 p-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <p className="text-blue-400 font-medium text-center text-sm">
            ✓ You&apos;re Participating
          </p>
        </div>
      )}

      {isWinner && (
        <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg">
          <p className="text-yellow-400 font-medium text-center">
            🎉 You Won!
          </p>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Entry Fee</span>
          <span className="font-medium">{raffle.entryFeeFormatted || `${Number(raffle.entryFee) / 1e18} ETH`}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Participants</span>
          <span className="font-medium">
            {raffle.currentParticipants}
            {raffle.maxParticipants && raffle.maxParticipants > 0 && `/${raffle.maxParticipants}`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Prize Pool</span>
          <span className="font-medium text-green-400">
            {raffle.totalPrizePoolFormatted || `${raffle.prizePool?.toFixed(4) || '0'} ETH`}
          </span>
        </div>
      </div>

      <Link
        href={`/room/${raffleAddress}`}
        className="block mt-4 text-center py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
      >
        View Details
      </Link>
    </Card>
  );
}
