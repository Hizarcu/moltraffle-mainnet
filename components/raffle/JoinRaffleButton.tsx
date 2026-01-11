'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { useJoinRaffle } from '@/lib/contracts/hooks/useJoinRaffle';
import { formatEthAmount } from '@/lib/utils/formatting';
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

  // Get user's balance
  const { data: balance } = useBalance({
    address: address,
  });

  // Format entry fee for display
  const entryFeeFormatted = raffle.entryFeeFormatted || `${raffle.prizePool / raffle.currentParticipants || 0} ETH`;
  // Get entry fee in Wei - handle both bigint and number
  const entryFeeInWei = typeof raffle.entryFee === 'bigint'
    ? raffle.entryFee
    : BigInt(Math.floor(Number(raffle.entryFee) * 1e18));
  // Entry fee as number (in ETH) for display calculations
  const entryFeeEth = Number(entryFeeInWei) / 1e18;
  // Total cost for selected tickets
  const totalCost = entryFeeInWei * BigInt(ticketCount);
  const totalCostFormatted = `${(entryFeeEth * ticketCount).toFixed(4)} ETH`;

  // Calculate max tickets user can buy
  const remainingSlots = raffle.maxParticipants
    ? raffle.maxParticipants - raffle.currentParticipants
    : 100; // Default max 100 if unlimited
  const maxAffordable = balance && entryFeeInWei > BigInt(0)
    ? Math.floor(Number(balance.value) / Number(entryFeeInWei))
    : 0;
  const maxTickets = Math.min(remainingSlots, maxAffordable, 100);

  const { joinRaffle, isJoining, hash } = useJoinRaffle({
    raffleAddress: raffle.contractAddress,
    entryFee: totalCost,  // Pass total cost for all tickets
    ticketCount: ticketCount,  // Pass number of tickets
    onSuccess: () => {
      setShowConfirmModal(false);
      setTicketCount(1);
      onSuccess?.();
    },
  });

  console.log('=== Join Raffle Debug ===');
  console.log('Entry Fee (ETH):', raffle.entryFee);
  console.log('Entry Fee (Wei):', entryFeeInWei.toString());
  console.log('Balance (Wei):', balance?.value.toString());
  console.log('Raffle Address:', raffle.contractAddress);
  console.log('========================');

  const hasInsufficientBalance = balance && balance.value < entryFeeInWei;
  const isRaffleFull = raffle.maxParticipants && raffle.currentParticipants >= raffle.maxParticipants;

  const handleJoinClick = () => {
    console.log('=== BUTTON CLICKED ===');

    if (!isConnected) {
      console.log('Not connected, returning');
      return;
    }

    if (hasInsufficientBalance) {
      console.log('Insufficient balance, returning');
      return;
    }

    console.log('Opening modal...');
    setShowConfirmModal(true);
  };

  const handleConfirmJoin = () => {
    joinRaffle();
  };

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
            <h3 className="text-lg font-semibold mb-2">You're In!</h3>
            <p className="text-text-secondary text-sm mb-4">
              You have <span className="font-bold text-primary-purple">{userTicketCount}</span> ticket{userTicketCount !== 1 ? 's' : ''}
            </p>

            {/* Buy More Tickets */}
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

        {/* Buy More Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => { setShowConfirmModal(false); setTicketCount(1); }}
          title="Buy More Tickets"
        >
          <div className="space-y-6">
            <div className="p-4 bg-background-tertiary rounded-lg">
              <div className="text-center mb-4">
                <p className="text-text-muted text-sm">You currently have</p>
                <p className="text-2xl font-bold text-primary-purple">{userTicketCount} ticket{userTicketCount !== 1 ? 's' : ''}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Number of Additional Tickets</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
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
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-center text-xl font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.min(maxTickets, ticketCount + 1))}
                      className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                      disabled={ticketCount >= maxTickets}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-1 text-center">
                    Max: {maxTickets} tickets
                  </p>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Price per ticket</span>
                  <span>{entryFeeFormatted}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-700 pt-2">
                  <span>Total</span>
                  <span className="text-gradient">{totalCostFormatted}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => { setShowConfirmModal(false); setTicketCount(1); }}
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmJoin}
                isLoading={isJoining}
                disabled={ticketCount < 1 || hasInsufficientBalance}
              >
                {isJoining ? 'Buying...' : `Buy ${ticketCount} Ticket${ticketCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </Modal>
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
          <h3 className="text-lg font-semibold mb-2">You're In!</h3>
          <p className="text-text-secondary text-sm">
            You have <span className="font-bold text-primary-purple">{userTicketCount}</span> ticket{userTicketCount !== 1 ? 's' : ''}. Good luck!
          </p>
        </div>
      </Card>
    );
  }

  // Not connected state
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
              Your balance: {balance ? formatEthAmount(balance.value) : '0 ETH'}
            </div>
          </div>
          <p className="text-sm text-semantic-error">
            You need more ETH to join this raffle
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
            {balance && (
              <div className="text-sm text-text-muted mt-2">
                Your balance: {formatEthAmount(balance.value)}
              </div>
            )}
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

      {/* Ticket Purchase Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => { setShowConfirmModal(false); setTicketCount(1); }}
        title="Buy Raffle Tickets"
      >
        <div className="space-y-6">
          <div className="p-4 bg-background-tertiary rounded-lg">
            <div className="space-y-4">
              {/* Ticket Selector */}
              <div>
                <label className="block text-sm font-medium mb-2">Number of Tickets</label>
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

              {/* Quick Select Buttons */}
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
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmJoin}
              isLoading={isJoining}
              disabled={ticketCount < 1}
            >
              {isJoining ? 'Processing...' : `Buy ${ticketCount} Ticket${ticketCount !== 1 ? 's' : ''}`}
            </Button>
          </div>

          {hash && (
            <div className="text-center">
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
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
    </>
  );
}
