'use client';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useDrawWinner } from '@/lib/contracts/hooks/useDrawWinner';

interface DrawWinnerButtonProps {
  raffleAddress: string;
  isCreator: boolean;
  hasEnded: boolean;
  hasParticipants: boolean;
  hasWinner: boolean;
  onSuccess?: () => void;
}

export function DrawWinnerButton({
  raffleAddress,
  isCreator,
  hasEnded,
  hasParticipants,
  hasWinner,
  onSuccess,
}: DrawWinnerButtonProps) {
  const { drawWinner, isDrawing } = useDrawWinner(raffleAddress, { onSuccess });

  // Winner already drawn - don't show anything
  if (hasWinner) {
    return null;
  }

  // Not creator - show waiting status
  if (!isCreator) {
    if (!hasEnded) {
      return (
        <Card variant="glass" className="p-4">
          <p className="text-center text-text-secondary text-sm">
            ⏳ Waiting for deadline to pass...
          </p>
        </Card>
      );
    }
    return (
      <Card variant="glass" className="p-4">
        <p className="text-center text-text-secondary text-sm">
          🎲 Waiting for creator to draw winner...
        </p>
      </Card>
    );
  }

  // Creator view - show appropriate button
  if (!hasEnded) {
    return (
      <Button disabled className="w-full">
        Draw Winner (Available After Deadline)
      </Button>
    );
  }

  if (!hasParticipants) {
    return (
      <Button disabled className="w-full">
        No Participants
      </Button>
    );
  }

  return (
    <Button
      onClick={drawWinner}
      disabled={isDrawing}
      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
    >
      {isDrawing ? 'Drawing Winner...' : '🎲 Draw Winner with Chainlink VRF'}
    </Button>
  );
}
