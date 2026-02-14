'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { useDrawWinner } from '@/lib/contracts/hooks/useDrawWinner';
import { useCancelRaffle } from '@/lib/contracts/hooks/useCancelRaffle';
import { useWithdrawRefund } from '@/lib/contracts/hooks/useWithdrawRefund';

interface DrawWinnerButtonProps {
  raffleAddress: string;
  hasEnded: boolean;
  hasParticipants: boolean;
  hasWinner: boolean;
  participantCount: number;
  isCancelled: boolean;
  userTicketCount: number;
  onSuccess?: () => void;
}

export function DrawWinnerButton({
  raffleAddress,
  hasEnded,
  hasParticipants,
  hasWinner,
  participantCount,
  isCancelled,
  userTicketCount,
  onSuccess,
}: DrawWinnerButtonProps) {
  const [actionDone, setActionDone] = useState(false);
  const handleSuccess = () => { setActionDone(true); onSuccess?.(); };
  const { drawWinner, isDrawing } = useDrawWinner(raffleAddress, { onSuccess: handleSuccess });
  const { cancelRaffle, isCancelling } = useCancelRaffle(raffleAddress, { onSuccess: handleSuccess });
  const { withdrawRefund, isWithdrawing } = useWithdrawRefund(raffleAddress, { onSuccess: handleSuccess });

  // Cancelled — show withdraw refund button if user has tickets
  if (isCancelled) {
    if (userTicketCount > 0) {
      return (
        <Button
          onClick={withdrawRefund}
          disabled={isWithdrawing || actionDone}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {isWithdrawing ? 'Withdrawing...' : actionDone ? 'Refund Withdrawn' : 'Withdraw Refund'}
        </Button>
      );
    }
    return null;
  }

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
          disabled={isCancelling || actionDone}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {isCancelling ? 'Cancelling...' : actionDone ? 'Cancelled' : 'Cancel & Refund'}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={drawWinner}
      disabled={isDrawing || actionDone}
      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
    >
      {isDrawing ? 'Drawing Winner...' : actionDone ? 'Winner Drawn — Waiting for VRF...' : 'Draw Winner'}
    </Button>
  );
}
