'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { RaffleCardFromAddress } from '@/components/raffle/RaffleCardFromAddress';
import { Badge } from '@/components/ui/Badge';
import { RaffleStatus } from '@/lib/types/raffle';
import { useAllRaffles } from '@/lib/contracts/hooks/useAllRaffles';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ExplorePage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'ended'>('all');
  const { address, isConnected } = useAccount();
  const { raffleAddresses, isLoading } = useAllRaffles();

  const hasBlockchainRaffles = raffleAddresses && raffleAddresses.length > 0;

  const statusFilters = [
    { value: 'all' as const, label: 'All Raffles' },
    { value: 'active' as const, label: 'Active' },
    { value: 'ended' as const, label: 'Ended' },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Explore <span className="text-gradient">Raffles</span>
          </h1>
          <p className="text-text-secondary">
            Browse and join provably fair onchain raffles
          </p>

          {/* Blockchain Status */}
          {isLoading ? (
            <div className="mt-4">
              <Skeleton className="h-8 w-64" />
            </div>
          ) : hasBlockchainRaffles ? (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg inline-block">
              <p className="text-sm text-green-400">
                ✓ Connected to blockchain • {raffleAddresses.length} {raffleAddresses.length === 1 ? 'raffle' : 'raffles'} on-chain
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg inline-block">
              <p className="text-sm text-blue-400">
                ℹ No raffles yet • Be the first to create one!
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedStatus === filter.value
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'bg-background-secondary text-text-secondary hover:bg-background-tertiary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>


        {/* Raffle Display */}
        {hasBlockchainRaffles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffleAddresses.map((raffleAddress) => (
              <RaffleCardFromAddress
                key={raffleAddress}
                raffleAddress={raffleAddress}
                userAddress={address}
                filterStatus={selectedStatus}
              />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-2">No Raffles Yet</h3>
            <p className="text-text-secondary mb-6">
              Be the first to create a raffle on this platform!
            </p>
            <Link href="/create">
              <Button size="lg">Create First Raffle</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
