'use client';

import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { useRaffleDetails } from '@/lib/contracts/hooks/useAllRaffles';
import Link from 'next/link';

interface RaffleCardFromAddressProps {
  raffleAddress: string;
  userAddress?: string;
  showOnlyIfParticipating?: boolean;
  filterStatus?: 'all' | 'active' | 'ended' | 'completed';
}

export function RaffleCardFromAddress({ raffleAddress, userAddress, showOnlyIfParticipating = false, filterStatus = 'all' }: RaffleCardFromAddressProps) {
  const { raffle, isLoading } = useRaffleDetails(raffleAddress);

  if (isLoading) {
    return (
      <div className="raffle-card">
        <div className="raffle-card-inner" style={{ padding: '28px 24px 24px' }}>
          <Skeleton className="h-6 w-24 mb-6 rounded-full" />
          <Skeleton className="h-14 w-32 mx-auto mb-6" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-5" />
          <div className="flex gap-3 mb-5">
            <Skeleton className="h-20 flex-1 rounded-xl" />
            <Skeleton className="h-20 flex-1 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!raffle) {
    return null;
  }

  // Check if user is participating in this raffle
  const isParticipating = userAddress && raffle.participants.some(
    p => p.toLowerCase() === userAddress.toLowerCase()
  );

  // If showOnlyIfParticipating is true and user is not participating, don't render
  if (showOnlyIfParticipating && !isParticipating) {
    return null;
  }

  // Filter by status if specified
  if (filterStatus !== 'all') {
    const status = raffle.status;
    const isActive = (typeof status === 'number' && status === 0) || status === 'active';
    const isEnded = (typeof status === 'number' && status === 1) || status === 'ended';
    const isCompleted = (typeof status === 'number' && (status === 2 || status === 4)) || status === 'drawn' || status === 'cancelled';

    if (filterStatus === 'active' && !isActive) return null;
    if (filterStatus === 'ended' && !isEnded) return null;
    if (filterStatus === 'completed' && !isCompleted) return null;
  }

  const getStatusStyle = (status: number | string) => {
    const s = typeof status === 'string' ? status : status;
    if (s === 0 || s === 'active') return { bg: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' };
    if (s === 1 || s === 'ended') return { bg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.1))', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' };
    if (s === 2 || s === 'drawn') return { bg: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.1))', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' };
    if (s === 3) return { bg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.1))', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' };
    if (s === 4 || s === 'cancelled') return { bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' };
    if (s === 5) return { bg: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.1))', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' };
    return { bg: 'linear-gradient(135deg, rgba(148,163,184,0.2), rgba(148,163,184,0.1))', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)' };
  };

  const getStatusLabel = (status: number | string) => {
    const s = typeof status === 'string' ? status : status;
    if (s === 0 || s === 'active') return 'Active';
    if (s === 1 || s === 'ended') return 'Ended';
    if (s === 2 || s === 'drawn') return 'Drawn';
    if (s === 3) return 'Drawing...';
    if (s === 4 || s === 'cancelled') return 'Cancelled';
    if (s === 5) return 'Completed';
    return 'Unknown';
  };

  const statusStyle = getStatusStyle(raffle.status as unknown as number);
  const statusLabel = getStatusLabel(raffle.status as unknown as number);
  const isActive = (raffle.status as unknown as number) === 0 || raffle.status === 'active';

  const prizePool = raffle.totalPrizePoolFormatted
    ? raffle.totalPrizePoolFormatted.replace(/\s*USDC/i, '')
    : `$${raffle.prizePool?.toFixed(2) || '0'}`;

  const entryFee = raffle.entryFeeFormatted
    ? raffle.entryFeeFormatted.replace(/\s*USDC/i, '')
    : `$${(Number(raffle.entryFee) / 1e6).toFixed(2)}`;

  const players = raffle.maxParticipants && raffle.maxParticipants > 0
    ? `${raffle.currentParticipants} / ${raffle.maxParticipants}`
    : `${raffle.currentParticipants}`;

  return (
    <Link href={`/room/${raffleAddress}`} className="block">
      <div className="raffle-card h-full">
        <div className="raffle-card-inner">
          {/* Sparkles */}
          <div className="raffle-sparkle" style={{ top: '15%', right: '12%', width: 5, height: 5, background: 'rgba(251,191,36,0.4)', animationDelay: '0s' }} />
          <div className="raffle-sparkle" style={{ top: '35%', right: '8%', width: 4, height: 4, background: 'rgba(236,72,153,0.3)', animationDelay: '1s' }} />
          <div className="raffle-sparkle" style={{ top: '10%', left: '30%', width: 3, height: 3, background: 'rgba(96,165,250,0.3)', animationDelay: '0.5s' }} />
          <div className="raffle-sparkle" style={{ top: '25%', left: '15%', width: 4, height: 4, background: 'rgba(167,139,250,0.35)', animationDelay: '1.5s' }} />

          {/* Status Row */}
          <div className="flex justify-between items-center mb-5 relative z-[1]">
            <span
              className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              style={{ background: statusStyle.bg, color: statusStyle.color, border: statusStyle.border }}
            >
              {statusLabel}
            </span>
            <span className="text-xl" style={{ color: 'rgba(167,139,250,0.5)' }}>&#10024;</span>
          </div>

          {/* Prize Section */}
          <div className="text-center py-6 relative z-[1]">
            <div className="text-[11px] font-semibold tracking-[2px] uppercase mb-2" style={{ color: 'rgba(167,139,250,0.6)' }}>
              Prize Pool
            </div>
            <div className="raffle-prize-amount">{prizePool}</div>
          </div>

          {/* Title & Description */}
          <div className="relative z-[1] mb-1">
            <h3 className="text-lg font-bold text-slate-100 line-clamp-1">{raffle.title}</h3>
          </div>
          <p className="text-[13px] line-clamp-1 mb-5 relative z-[1]" style={{ color: 'rgba(148,163,184,0.7)' }}>
            {raffle.description}
          </p>

          {/* Stats Row */}
          <div className="flex gap-3 mb-5 relative z-[1]">
            <div className="flex-1 rounded-[14px] p-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[1.2px] uppercase mb-1.5" style={{ color: 'rgba(167,139,250,0.5)' }}>
                <span className="text-sm">&#9889;</span> ENTRY
              </div>
              <div className="text-lg font-bold text-slate-200">{entryFee}</div>
            </div>
            <div className="flex-1 rounded-[14px] p-3.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[1.2px] uppercase mb-1.5" style={{ color: 'rgba(167,139,250,0.5)' }}>
                <span className="text-sm">&#128101;</span> PLAYERS
              </div>
              <div className="text-lg font-bold text-slate-200">{players}</div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="relative z-[1] mt-auto">
            <div
              className="w-full py-4 rounded-2xl text-[15px] font-bold text-white text-center transition-all"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)'
                  : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%)',
                boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
              }}
            >
              {isActive ? 'Join Now' : 'View Details'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
