'use client';

import { useState, useEffect } from 'react';
import { formatAddress } from '@/lib/utils/formatting';
import { Button } from '@/components/ui/Button';
import { fetchAgentProfiles } from '@/lib/utils/agentProfiles';
import { AgentProfile } from '@/lib/contexts/AgentContext';

interface ParticipantListProps {
  participants: string[];
  currentUserAddress?: string;
}

export function ParticipantList({ participants, currentUserAddress }: ParticipantListProps) {
  const [showAll, setShowAll] = useState(false);
  const [agentProfiles, setAgentProfiles] = useState<Map<string, AgentProfile>>(new Map());
  const displayCount = 10;
  const hasMore = participants.length > displayCount;
  const displayedParticipants = showAll ? participants : participants.slice(0, displayCount);

  // Fetch agent profiles for all participants
  useEffect(() => {
    if (participants.length > 0) {
      fetchAgentProfiles(participants).then(setAgentProfiles);
    }
  }, [participants]);

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
          const agentProfile = agentProfiles.get(address.toLowerCase());

          return (
            <div
              key={`${address}-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isCurrentUser
                  ? 'bg-primary-purple/20 border border-primary-purple/30'
                  : 'bg-background-tertiary'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                {agentProfile ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold truncate">{agentProfile.name}</span>
                    {agentProfile.isVerified && (
                      <span className="text-xs text-green-400">✓</span>
                    )}
                    {isCurrentUser && (
                      <span className="text-xs bg-primary-purple px-2 py-1 rounded flex-shrink-0">
                        You
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {formatAddress(address, 6)}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs bg-primary-purple px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </div>
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
