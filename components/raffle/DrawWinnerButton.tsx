'use client';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useDrawWinner } from '@/lib/contracts/hooks/useDrawWinner';

interface DrawWinnerButtonProps {
  raffleAddress: string;
  hasEnded: boolean;
  hasParticipants: boolean;
  hasWinner: boolean;
  onSuccess?: () => void;
}

export function DrawWinnerButton({
  raffleAddress,
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

  // Not ready to draw yet - show disabled button
  if (!hasEnded) {
    return (
      <Button disabled className="w-full">
        Draw Winner (Not Ready Yet)
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
      {isDrawing ? 'Drawing Winner...' : 'Draw Winner'}
    </Button>
  );
}
