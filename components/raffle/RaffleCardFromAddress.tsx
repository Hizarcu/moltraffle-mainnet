'use client';

import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { useRaffleDetails } from '@/lib/contracts/hooks/useAllRaffles';
import Link from 'next/link';

interface RaffleCardFromAddressProps {
  raffleAddress: string;
  userAddress?: string;
}

export function RaffleCardFromAddress({ raffleAddress, userAddress }: RaffleCardFromAddressProps) {
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

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-green-500/20 text-green-400'; // ACTIVE
      case 1: return 'bg-yellow-500/20 text-yellow-400'; // ENDED
      case 2: return 'bg-purple-500/20 text-purple-400'; // DRAWN
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Ended';
      case 2: return 'Drawn';
      default: return 'Unknown';
    }
  };

  const isWinner = raffle.winner && userAddress &&
                   raffle.winner.toLowerCase() === userAddress.toLowerCase();

  return (
    <Card className="p-6 hover:border-purple-500/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-lg">{raffle.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(raffle.status)}`}>
          {getStatusLabel(raffle.status)}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
        {raffle.description}
      </p>

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
          <span className="font-medium">{raffle.entryFee} ETH</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Participants</span>
          <span className="font-medium">
            {raffle.currentParticipants}
            {raffle.maxParticipants > 0 && `/${raffle.maxParticipants}`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Prize Pool</span>
          <span className="font-medium text-green-400">
            {raffle.prizePool.toFixed(4)} ETH
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
