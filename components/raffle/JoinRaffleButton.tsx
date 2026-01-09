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
  onSuccess?: () => void;
}

export function JoinRaffleButton({ raffle, hasJoined, onSuccess }: JoinRaffleButtonProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { address, isConnected } = useAccount();

  // Get user's balance
  const { data: balance } = useBalance({
    address: address,
  });

  const { joinRaffle, isJoining, hash } = useJoinRaffle({
    raffleAddress: raffle.contractAddress,
    entryFee: raffle.entryFee,
    onSuccess: () => {
      setShowConfirmModal(false);
      onSuccess?.();
    },
  });

  // Format entry fee for display
  const entryFeeFormatted = `${raffle.entryFee} ETH`;
  const entryFeeInWei = BigInt(Math.floor(raffle.entryFee * 1e18));

  console.log('=== Join Raffle Debug ===');
  console.log('Entry Fee (ETH):', raffle.entryFee);
  console.log('Entry Fee (Wei):', entryFeeInWei.toString());
  console.log('Balance (Wei):', balance?.value.toString());
  console.log('Raffle Address:', raffle.contractAddress);
  console.log('========================');

  const hasInsufficientBalance = balance && balance.value < entryFeeInWei;
  const isRaffleFull = raffle.maxParticipants && raffle.currentParticipants >= raffle.maxParticipants;

  const handleJoinClick = () => {
    if (!isConnected) {
      // User will be prompted by ConnectButton in navbar
      return;
    }

    if (hasInsufficientBalance) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmJoin = () => {
    joinRaffle();
  };

  // Already joined state
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
            You're participating in this raffle. Good luck!
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
            <div className="text-text-muted text-sm mb-1">Entry Fee</div>
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
            {isJoining ? 'Joining...' : 'Join Raffle'}
          </Button>

          <p className="text-xs text-text-muted mt-4">
            Winner selected using Chainlink VRF for provably fair randomness
          </p>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Join Raffle"
      >
        <div className="space-y-6">
          <div className="p-4 bg-background-tertiary rounded-lg">
            <h4 className="font-semibold mb-3">Raffle Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Entry Fee</span>
                <span className="font-semibold">{entryFeeFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Current Participants</span>
                <span className="font-semibold">{raffle.currentParticipants}</span>
              </div>
              {raffle.maxParticipants && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Max Participants</span>
                  <span className="font-semibold">{raffle.maxParticipants}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-semantic-info/10 border border-semantic-info/30 rounded-lg">
            <p className="text-sm text-text-secondary">
              <strong>Important:</strong> Once you join, you cannot withdraw your entry fee.
              The winner will be selected fairly using Chainlink VRF after the deadline.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmJoin}
              isLoading={isJoining}
            >
              {isJoining ? 'Confirming...' : 'Confirm & Join'}
            </Button>
          </div>

          {hash && (
            <div className="text-center">
              <a
                href={`https://etherscan.io/tx/${hash}`}
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
