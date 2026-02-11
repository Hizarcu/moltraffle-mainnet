'use client';

import { Button } from '../ui/Button';
import { useDrawWinner } from '@/lib/contracts/hooks/useDrawWinner';
import { useCancelRaffle } from '@/lib/contracts/hooks/useCancelRaffle';

interface DrawWinnerButtonProps {
  raffleAddress: string;
  hasEnded: boolean;
  hasParticipants: boolean;
  hasWinner: boolean;
  participantCount: number;
  onSuccess?: () => void;
}

export function DrawWinnerButton({
  raffleAddress,
  hasEnded,
  hasParticipants,
  hasWinner,
  participantCount,
  onSuccess,
}: DrawWinnerButtonProps) {
  const { drawWinner, isDrawing } = useDrawWinner(raffleAddress, { onSuccess });
  const { cancelRaffle, isCancelling } = useCancelRaffle(raffleAddress, { onSuccess });

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

  // Ended but not enough participants - show underfilled state
  if (participantCount < 2) {
    return (
      <div className="space-y-3">
        <Button disabled className="w-full">
          Not Enough Participants
        </Button>
        <Button
          onClick={cancelRaffle}
          disabled={isCancelling}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {isCancelling ? 'Refunding...' : 'Cancel & Refund'}
        </Button>
      </div>
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
