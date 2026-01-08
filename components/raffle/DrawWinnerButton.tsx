'use client';

import { Button } from '../ui/Button';
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

  if (!isCreator) {
    return null;
  }

  if (hasWinner) {
    return null;
  }

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
