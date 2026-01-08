'use client';

import { useState } from 'react';
import { formatAddress } from '@/lib/utils/formatting';
import { Button } from '@/components/ui/Button';

interface ParticipantListProps {
  participants: string[];
  currentUserAddress?: string;
}

export function ParticipantList({ participants, currentUserAddress }: ParticipantListProps) {
  const [showAll, setShowAll] = useState(false);
  const displayCount = 10;
  const hasMore = participants.length > displayCount;
  const displayedParticipants = showAll ? participants : participants.slice(0, displayCount);

  if (participants.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-2">👥</div>
        <p className="text-text-secondary">No participants yet</p>
        <p className="text-sm text-text-muted mt-1">Be the first to join!</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">
        Participants ({participants.length})
      </h3>

      <div className="space-y-2">
        {displayedParticipants.map((address, index) => {
          const isCurrentUser = currentUserAddress?.toLowerCase() === address.toLowerCase();

          return (
            <div
              key={`${address}-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isCurrentUser
                  ? 'bg-primary-purple/20 border border-primary-purple/30'
                  : 'bg-background-tertiary'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="font-mono text-sm">
                  {formatAddress(address, 6)}
                </span>
                {isCurrentUser && (
                  <span className="text-xs bg-primary-purple px-2 py-1 rounded">
                    You
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          className="w-full mt-4"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Less' : `Show All (${participants.length})`}
        </Button>
      )}
    </div>
  );
}
