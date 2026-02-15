'use client';

import { useState } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { useJoinRaffle } from '@/lib/contracts/hooks/useJoinRaffle';
import { useUSDCApproval } from '@/lib/contracts/hooks/useUSDCApproval';
import { formatUsdcAmount } from '@/lib/utils/formatting';
import { USDCABI } from '@/lib/contracts/abis/USDC';
import { getUSDCAddress } from '@/lib/contracts/addresses';
import { Raffle } from '@/lib/types/raffle';

interface JoinRaffleButtonProps {
  raffle: Raffle;
  hasJoined: boolean;
  userTicketCount?: number;
  onSuccess?: () => void;
}

export function JoinRaffleButton({ raffle, hasJoined, userTicketCount = 0, onSuccess }: JoinRaffleButtonProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const usdcAddress = getUSDCAddress(chainId);

  // Get user's USDC balance
  const { data: usdcBalance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: USDCABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!usdcAddress,
      refetchInterval: 10000,
    },
  });

  const balanceValue = (usdcBalance as bigint) ?? BigInt(0);

  // Format entry fee for display
  const entryFeeFormatted = raffle.entryFeeFormatted || formatUsdcAmount(raffle.entryFee);
  // Get entry fee in USDC units (6 decimals)
  const entryFeeRaw = typeof raffle.entryFee === 'bigint'
    ? raffle.entryFee
    : BigInt(Math.floor(Number(raffle.entryFee) * 1e6));
  // Entry fee as number (in USDC) for display calculations
  const entryFeeUsdc = Number(entryFeeRaw) / 1e6;
  // Total cost for selected tickets
  const totalCost = entryFeeRaw * BigInt(ticketCount);
  const totalCostFormatted = `$${(entryFeeUsdc * ticketCount).toFixed(2)} USDC`;

  // Calculate max tickets user can buy
  const remainingSlots = raffle.maxParticipants
    ? raffle.maxParticipants - raffle.currentParticipants
    : 100;
  const maxAffordable = entryFeeRaw > BigInt(0)
    ? Math.floor(Number(balanceValue) / Number(entryFeeRaw))
    : 0;
  const maxTickets = Math.min(remainingSlots, maxAffordable, 100);

  // USDC approval
  const { needsApproval, approve, isApproving } = useUSDCApproval({
    requiredAmount: totalCost,
  });

  const { joinRaffle, isJoining, hash } = useJoinRaffle({
    raffleAddress: raffle.contractAddress,
    ticketCount: ticketCount,
    onSuccess: () => {
      setShowConfirmModal(false);
      setTicketCount(1);
      onSuccess?.();
    },
  });

  const hasInsufficientBalance = balanceValue < entryFeeRaw;
  const isRaffleFull = raffle.maxParticipants && raffle.currentParticipants >= raffle.maxParticipants;

  const handleJoinClick = () => {
    if (!isConnected) return;
    if (hasInsufficientBalance) return;
    setShowConfirmModal(true);
  };

  const handleConfirmJoin = () => {
    if (needsApproval) {
      approve();
    } else {
      joinRaffle();
    }
  };

  // Ticket purchase modal content (shared)
  const ticketModalContent = (title: string) => (
    <Modal
      isOpen={showConfirmModal}
      onClose={() => { setShowConfirmModal(false); setTicketCount(1); }}
      title={title}
    >
      <div className="space-y-6">
        <div className="p-4 bg-background-tertiary rounded-lg">
          <div className="space-y-4">
            {hasJoined && (
              <div className="text-center mb-4">
                <p className="text-text-muted text-sm">You currently have</p>
                <p className="text-2xl font-bold text-primary-purple">{userTicketCount} ticket{userTicketCount !== 1 ? 's' : ''}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                {hasJoined ? 'Number of Additional Tickets' : 'Number of Tickets'}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                  className="w-12 h-12 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xl font-bold"
                  disabled={ticketCount <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={maxTickets}
                  value={ticketCount}
                  onChange={(e) => setTicketCount(Math.min(maxTickets, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-center text-2xl font-bold"
                />
                <button
                  type="button"
                  onClick={() => setTicketCount(Math.min(maxTickets, ticketCount + 1))}
                  className="w-12 h-12 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-xl font-bold"
                  disabled={ticketCount >= maxTickets}
                >
                  +
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1 text-center">
                Max: {maxTickets} tickets available
              </p>
            </div>

            {maxTickets >= 5 && (
              <div className="flex gap-2 justify-center">
                {[1, 5, 10, 25].filter(n => n <= maxTickets).map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTicketCount(num)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      ticketCount === num
                        ? 'bg-primary-purple text-white'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Price per ticket</span>
                <span>{entryFeeFormatted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Tickets</span>
                <span>x {ticketCount}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-600">
                <span>Total</span>
                <span className="text-gradient">{totalCostFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {needsApproval && (
          <div className="p-4 bg-semantic-warning/10 border border-semantic-warning/30 rounded-lg">
            <p className="text-sm text-text-secondary">
              <strong>USDC Approval Required.</strong> You need to approve the Factory contract to spend your USDC. This is a one-time action.
            </p>
          </div>
        )}

        <div className="p-4 bg-semantic-info/10 border border-semantic-info/30 rounded-lg">
          <p className="text-sm text-text-secondary">
            <strong>More tickets = Better odds!</strong> Each ticket is an entry into the raffle.
            Winner selected fairly using Chainlink VRF after the deadline.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => { setShowConfirmModal(false); setTicketCount(1); }}
            disabled={isJoining || isApproving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirmJoin}
            isLoading={isJoining || isApproving}
            disabled={ticketCount < 1}
          >
            {isApproving ? 'Approving USDC...' :
             needsApproval ? 'Approve USDC' :
             isJoining ? 'Processing...' :
             `Buy ${ticketCount} Ticket${ticketCount !== 1 ? 's' : ''}`}
          </Button>
        </div>

        {hash && (
          <div className="text-center">
            <a
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-purple hover:underline"
            >
              View Transaction →
            </a>
          </div>
        )}
      </div>
    </Modal>
  );

  // Already joined state - but can buy more tickets
  if (hasJoined && !isRaffleFull) {
    return (
      <>
        <Card variant="glass" className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-semantic-success/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">You&apos;re In!</h3>
            <p className="text-text-secondary text-sm mb-4">
              You have <span className="font-bold text-primary-purple">{userTicketCount}</span> ticket{userTicketCount !== 1 ? 's' : ''}
            </p>

            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-sm text-text-muted mb-3">Want to improve your chances?</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmModal(true)}
              >
                Buy More Tickets
              </Button>
            </div>
          </div>
        </Card>
        {ticketModalContent('Buy More Tickets')}
      </>
    );
  }

  // Already joined and raffle is full
  if (hasJoined) {
    return (
      <Card variant="glass" className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-semantic-success/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">You&apos;re In!</h3>
          <p className="text-text-secondary text-sm">
            You have <span className="font-bold text-primary-purple">{userTicketCount}</span> ticket{userTicketCount !== 1 ? 's' : ''}. Good luck!
          </p>
        </div>
      </Card>
    );
  }

  // Not connected wallet state
  if (!isConnected) {
    return (
      <Card variant="gradient-border" className="p-6">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Join This Raffle</h3>
          <div className="mb-6">
            <div className="text-text-muted text-sm mb-1">Entry Fee</div>
            <div className="text-3xl font-bold text-gradient">
              {entryFeeFormatted}
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Connect your wallet to join this raffle
          </p>
          <appkit-button />
        </div>
      </Card>
    );
  }

  // Raffle full state
  if (isRaffleFull) {
    return (
      <Card variant="glass" className="p-6">
        <div className="text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-lg font-semibold mb-2">Raffle Full</h3>
          <p className="text-text-secondary text-sm">
            Maximum participants reached
          </p>
        </div>
      </Card>
    );
  }

  // Insufficient balance state
  if (hasInsufficientBalance) {
    return (
      <Card variant="glass" className="p-6">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Insufficient Balance</h3>
          <div className="mb-4">
            <div className="text-text-muted text-sm mb-1">Entry Fee</div>
            <div className="text-2xl font-bold text-gradient mb-2">
              {entryFeeFormatted}
            </div>
            <div className="text-sm text-text-muted">
              Your balance: {formatUsdcAmount(balanceValue)}
            </div>
          </div>
          <p className="text-sm text-semantic-error">
            You need more USDC to join this raffle
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card variant="gradient-border" className="p-6">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Join This Raffle</h3>

          <div className="mb-6">
            <div className="text-text-muted text-sm mb-1">Entry Fee per Ticket</div>
            <div className="text-3xl font-bold text-gradient">
              {entryFeeFormatted}
            </div>
            <div className="text-sm text-text-muted mt-2">
              Your balance: {formatUsdcAmount(balanceValue)}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleJoinClick}
            isLoading={isJoining}
          >
            {isJoining ? 'Joining...' : 'Buy Tickets'}
          </Button>

          <p className="text-xs text-text-muted mt-4">
            Buy multiple tickets to increase your chances. Winner selected using Chainlink VRF.
          </p>
        </div>
      </Card>
      {ticketModalContent('Buy Raffle Tickets')}
    </>
  );
}
