'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from './CountdownTimer';
import { Raffle, RaffleStatus } from '@/lib/types/raffle';
import { formatAddress, formatPercentage, getStatusColor } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils/cn';

interface RaffleCardProps {
  raffle: Raffle;
  className?: string;
}

export function RaffleCard({ raffle, className }: RaffleCardProps) {
  const progressPercentage = raffle.maxParticipants
    ? (raffle.currentParticipants / raffle.maxParticipants) * 100
    : 0;

  const isActive = raffle.status === RaffleStatus.ACTIVE;
  const isDrawn = raffle.status === RaffleStatus.DRAWN;

  return (
    <Link href={`/room/${raffle.id}`}>
      <Card
        variant="glass"
        hover
        className={cn('h-full flex flex-col', className)}
      >
        {/* Header with Status Badge */}
        <div className="flex items-start justify-between mb-4">
          <Badge variant={getStatusColor(raffle.status)}>
            {raffle.status.toUpperCase()}
          </Badge>
          {isActive && (
            <CountdownTimer deadline={raffle.deadline} />
          )}
        </div>

        {/* Prize Image (if available) */}
        {raffle.prizeImageUrl && (
          <div className="w-full h-40 bg-background-tertiary rounded-lg mb-4 overflow-hidden">
            <img
              src={raffle.prizeImageUrl}
              alt={raffle.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title & Description */}
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 line-clamp-2">
            {raffle.title}
          </h3>
          <p className="text-text-secondary text-sm line-clamp-2 mb-4">
            {raffle.prizeDescription}
          </p>
        </div>

        {/* Stats */}
        <div className="space-y-3 mt-4">
          {/* Entry Fee */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-sm">Entry Fee</span>
            <span className="font-semibold text-primary-purple">
              {raffle.entryFeeFormatted}
            </span>
          </div>

          {/* Prize Pool */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-sm">Prize Pool</span>
            <span className="font-semibold text-semantic-success">
              {raffle.totalPrizePoolFormatted}
            </span>
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-muted text-sm">Participants</span>
              <span className="font-semibold">
                {raffle.currentParticipants}
                {raffle.maxParticipants && ` / ${raffle.maxParticipants}`}
              </span>
            </div>

            {/* Progress Bar */}
            {raffle.maxParticipants && (
              <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Winner (if drawn) */}
          {isDrawn && raffle.winner && (
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-sm">Winner:</span>
                <span className="font-mono text-sm text-semantic-success">
                  {formatAddress(raffle.winner)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hover Effect Indicator */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-text-muted">
          <span>View Details</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
