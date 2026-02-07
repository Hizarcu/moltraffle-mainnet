'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountdownTimer } from '@/components/raffle/CountdownTimer';
import { RaffleStats } from '@/components/raffle/RaffleStats';
import { ParticipantList } from '@/components/raffle/ParticipantList';
import { JoinRaffleButton } from '@/components/raffle/JoinRaffleButton';
import { WinnerDisplay } from '@/components/raffle/WinnerDisplay';
import { DrawWinnerButton } from '@/components/raffle/DrawWinnerButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRaffleDetails } from '@/lib/contracts/hooks/useAllRaffles';
import { formatAddress, formatDate, getStatusColor } from '@/lib/utils/formatting';
import { RaffleStatus } from '@/lib/types/raffle';
import { useAgentProfile } from '@/lib/hooks/useAgentProfile';
import { AgentProfileDisplay } from '@/components/agent/AgentProfile';
import { useAgent } from '@/lib/contexts/AgentContext';

export default function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { address } = useAccount();
  const { isAuthenticated: isAgent } = useAgent();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const { width, height } = useWindowSize();

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch from blockchain
  const { raffle, isLoading } = useRaffleDetails(id);

  // Fetch creator's agent profile
  const { data: creatorAgent } = useAgentProfile(raffle?.creator);

  // Calculate hasEnded only on client to avoid hydration mismatch
  useEffect(() => {
    if (!isMounted || !raffle) return;

    const checkEnded = () => {
      const now = new Date();
      const deadline = new Date(raffle.deadline);
      setHasEnded(now > deadline);
    };

    checkEnded();
    // Check every second in case deadline passes while viewing
    const interval = setInterval(checkEnded, 1000);
    return () => clearInterval(interval);
  }, [raffle?.deadline, isMounted, raffle]);

  const handleJoinSuccess = () => {
    // Refresh the page data after successful join
    setRefreshKey(prev => prev + 1);
  };

  const handleDrawSuccess = () => {
    // Refresh the page data and show confetti after winner is drawn
    setRefreshKey(prev => prev + 1);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 10000); // Stop confetti after 10s
  };

  // Show loading state while fetching from blockchain
  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-96 mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-32 w-full" />
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card variant="glass" className="max-w-md w-full p-12 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Raffle Not Found</h2>
          <p className="text-text-secondary mb-6">
            The raffle you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/explore">
            <Button>Browse Other Raffles</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Handle both blockchain (number) and mock (string) status
  const status = typeof raffle.status === 'number' ? raffle.status :
                 raffle.status === 'active' ? 0 :
                 raffle.status === 'ended' ? 1 : 2;

  const hasWinner = !!(raffle.winner && raffle.winner !== '0x0000000000000000000000000000000000000000');

  // Check if prize was already claimed (status = CANCELLED after claiming)
  const prizeClaimed = typeof raffle.status === 'number' && raffle.status === 4; // RaffleStatus.CANCELLED

  // Check if max participants reached
  const isMaxParticipantsReached = (raffle.maxParticipants ?? 0) > 0 && raffle.currentParticipants >= (raffle.maxParticipants ?? 0);

  // Ready to draw if deadline passed OR max participants reached
  const isReadyToDraw = hasEnded || isMaxParticipantsReached;

  // Use our own calculation instead of buggy contract status
  const isActive = !isReadyToDraw && !hasWinner;
  const isDrawn = hasWinner;

  const hasJoined = address && raffle.participants.some(
    p => p.toLowerCase() === address.toLowerCase()
  );
  // Count how many tickets the user has (same address can appear multiple times)
  const userTicketCount = address
    ? raffle.participants.filter(p => p.toLowerCase() === address.toLowerCase()).length
    : 0;
  const isCreator = address && raffle.creator.toLowerCase() === address.toLowerCase();
  const hasParticipants = raffle.participants.length > 0;

  return (
    <div className="min-h-screen p-4 sm:p-8">
      {/* Confetti Animation - only render on client after mount */}
      {isMounted && (showConfetti || isDrawn) && width > 0 && (
        <Confetti
          width={width}
          height={height}
          recycle={showConfetti}
          numberOfPieces={showConfetti ? 200 : 0}
        />
      )}

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
              <Badge variant={status === 0 ? 'success' : status === 1 ? 'warning' : 'default'}>
                {status === 0 ? 'ACTIVE' : status === 1 ? 'ENDED' : 'DRAWN'}
              </Badge>
              {hasJoined && (
                <Badge variant="info">You&apos;re Participating</Badge>
              )}
            </div>
            <CountdownTimer deadline={raffle.deadline} />
          </div>

          <h1 className="text-4xl font-bold mb-4">{raffle.title}</h1>
          <p className="text-lg text-text-secondary">{raffle.description}</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prize Pool */}
            <Card variant="glass">
              <h2 className="text-2xl font-semibold mb-4">Prize Pool</h2>
              <div className="p-6 bg-gradient-primary/10 rounded-lg border border-primary-purple/20">
                <div className="text-3xl font-bold text-gradient mb-2">
                  {raffle.totalPrizePoolFormatted || `${raffle.prizePool.toFixed(4)} ETH`}
                </div>
                <p className="text-text-secondary text-sm">
                  {raffle.maxParticipants && raffle.maxParticipants > 0 ? (
                    <>
                      {raffle.currentParticipants} of {raffle.maxParticipants} participants
                      <span className="mx-2">|</span>
                      Max Prize: {raffle.entryFeeFormatted} x {raffle.maxParticipants}
                    </>
                  ) : (
                    <>
                      {raffle.currentParticipants} participant{raffle.currentParticipants !== 1 ? 's' : ''}
                      <span className="mx-2">x</span>
                      {raffle.entryFeeFormatted} entry fee
                    </>
                  )}
                </p>
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

            {/* Winner Display (if drawn) */}
            {isDrawn && raffle.winner && raffle.vrfRequestId && (
              <WinnerDisplay
                winner={raffle.winner}
                winnerIndex={raffle.winnerIndex || 0}
                randomNumber={raffle.randomNumber ? String(raffle.randomNumber) : '0'}
                vrfRequestId={raffle.vrfRequestId}
                prizePool={raffle.totalPrizePoolFormatted || `${raffle.prizePool.toFixed(4)} ETH`}
                totalParticipants={raffle.participants.length}
                raffleAddress={raffle.contractAddress}
                prizeClaimed={prizeClaimed}
                onClaimSuccess={() => setRefreshKey(prev => prev + 1)}
              />
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
                  hasJoined={!!hasJoined}
                  userTicketCount={userTicketCount}
                  onSuccess={handleJoinSuccess}
                />
              )}

              {/* Draw Winner Button (Agents Only) */}
              {isAgent && (
                <DrawWinnerButton
                  raffleAddress={raffle.contractAddress}
                  hasEnded={isReadyToDraw}
                  hasParticipants={hasParticipants}
                  hasWinner={hasWinner}
                  onSuccess={handleDrawSuccess}
                />
              )}

              {/* Creator Info */}
              <Card variant="glass">
                <h3 className="font-semibold mb-3">Created By</h3>
                {creatorAgent ? (
                  <AgentProfileDisplay agent={creatorAgent} showFullDetails size="md" />
                ) : (
                  <p className="font-mono text-sm text-text-secondary break-all">
                    {formatAddress(raffle.creator, 8)}
                  </p>
                )}
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
