'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountdownTimer } from '@/components/raffle/CountdownTimer';
import { RaffleStats } from '@/components/raffle/RaffleStats';
import { ParticipantList } from '@/components/raffle/ParticipantList';
import { JoinRaffleButton } from '@/components/raffle/JoinRaffleButton';
import { getRaffleById } from '@/lib/utils/mockData';
import { formatAddress, formatDate, getStatusColor } from '@/lib/utils/formatting';
import { RaffleStatus } from '@/lib/types/raffle';

export default function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address } = useAccount();
  const raffle = getRaffleById(id);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleJoinSuccess = () => {
    // Refresh the page data after successful join
    setRefreshKey(prev => prev + 1);
  };

  if (!raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card variant="glass" className="max-w-md w-full p-12 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Raffle Not Found</h2>
          <p className="text-text-secondary mb-6">
            The raffle you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/explore">
            <Button>Browse Other Raffles</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isActive = raffle.status === RaffleStatus.ACTIVE;
  const isDrawn = raffle.status === RaffleStatus.DRAWN;
  const hasJoined = address && raffle.participants.some(
    p => p.toLowerCase() === address.toLowerCase()
  );

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link href="/explore" className="inline-flex items-center text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Explore
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Badge variant={getStatusColor(raffle.status)}>
                {raffle.status.toUpperCase()}
              </Badge>
              {hasJoined && (
                <Badge variant="info">You're Participating</Badge>
              )}
            </div>
            {isActive && (
              <CountdownTimer deadline={raffle.deadline} />
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4">{raffle.title}</h1>
          <p className="text-lg text-text-secondary">{raffle.description}</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prize Details */}
            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Prize</h2>
              <div className="p-6 bg-gradient-primary/10 rounded-lg border border-primary-purple/20">
                <p className="text-xl font-bold text-gradient">{raffle.prizeDescription}</p>
              </div>
            </Card>

            {/* Stats */}
            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-6">Raffle Stats</h2>
              <RaffleStats raffle={raffle} />
            </Card>

            {/* Timeline */}
            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-muted">Created</span>
                  <span className="font-medium">{formatDate(raffle.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Deadline</span>
                  <span className="font-medium">{formatDate(raffle.deadline)}</span>
                </div>
                {raffle.drawDate && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Winner Drawn</span>
                    <span className="font-medium">{formatDate(raffle.drawDate)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Winner Info (if drawn) */}
            {isDrawn && raffle.winner && (
              <Card variant="gradient-border">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold mb-4">Winner Announced!</h2>
                  <div className="mb-6">
                    <p className="text-text-muted mb-2">Winning Address</p>
                    <p className="text-2xl font-mono font-bold text-semantic-success">
                      {formatAddress(raffle.winner, 8)}
                    </p>
                  </div>

                  {raffle.vrfRequestId && (
                    <div className="p-6 bg-background-secondary rounded-lg">
                      <h3 className="font-semibold mb-4">Verifiable Proof</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">VRF Request ID</span>
                          <span className="font-mono">{raffle.vrfRequestId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Winner Index</span>
                          <span className="font-mono">{raffle.winnerIndex}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Random Number</span>
                          <span className="font-mono">{raffle.randomNumber?.toString().slice(0, 10)}...</span>
                        </div>
                      </div>
                      <Button variant="secondary" className="w-full mt-4">
                        Verify on Chainlink Explorer
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Participants List */}
            <ParticipantList participants={raffle.participants} currentUserAddress={address} />
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Join Raffle Card */}
              {isActive && (
                <JoinRaffleButton
                  raffle={raffle}
                  hasJoined={hasJoined}
                  onSuccess={handleJoinSuccess}
                />
              )}

              {/* Creator Info */}
              <Card variant="glass">
                <h3 className="font-semibold mb-3">Created By</h3>
                <p className="font-mono text-sm text-text-secondary break-all">
                  {formatAddress(raffle.creator, 8)}
                </p>
              </Card>

              {/* Contract Info */}
              <Card variant="glass">
                <h3 className="font-semibold mb-3">Contract</h3>
                <p className="font-mono text-xs text-text-secondary break-all">
                  {raffle.contractAddress}
                </p>
                <Button variant="ghost" size="sm" className="w-full mt-3">
                  View on Explorer
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
