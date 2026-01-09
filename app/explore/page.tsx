'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { RaffleGrid } from '@/components/raffle/RaffleGrid';
import { RaffleCardFromAddress } from '@/components/raffle/RaffleCardFromAddress';
import { Badge } from '@/components/ui/Badge';
import { RaffleStatus } from '@/lib/types/raffle';
import { mockRaffles } from '@/lib/utils/mockData';
import { useAllRaffles } from '@/lib/contracts/hooks/useAllRaffles';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function ExplorePage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'ended' | 'drawn'>('all');
  const { address } = useAccount();
  const { raffleAddresses, isLoading } = useAllRaffles();

  // Use blockchain data if available, otherwise fall back to mock data
  const hasBlockchainRaffles = raffleAddresses && raffleAddresses.length > 0;
  const displayRaffles = !hasBlockchainRaffles ? mockRaffles : [];

  // Filter mock raffles by status (only used when no blockchain raffles)
  const filteredRaffles = selectedStatus === 'all'
    ? displayRaffles
    : displayRaffles.filter(r => r.status === selectedStatus);

  const statusFilters = [
    { value: 'all' as const, label: 'All Raffles', count: hasBlockchainRaffles ? raffleAddresses.length : displayRaffles.length },
    { value: 'active' as const, label: 'Active', count: hasBlockchainRaffles ? raffleAddresses.length : displayRaffles.filter(r => r.status === 'active').length },
    { value: 'ended' as const, label: 'Ended', count: 0 },
    { value: 'drawn' as const, label: 'Drawn', count: 0 },
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
            Browse all raffles and find the perfect one to join
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
                ℹ No on-chain raffles yet • Showing demo data • Create the first raffle!
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
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-text-muted">
            Showing {hasBlockchainRaffles ? raffleAddresses.length : filteredRaffles.length} {hasBlockchainRaffles ? (raffleAddresses.length === 1 ? 'raffle' : 'raffles') : (filteredRaffles.length === 1 ? 'raffle' : 'raffles')}
          </p>
        </div>

        {/* Raffle Display */}
        {hasBlockchainRaffles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffleAddresses.map((raffleAddress) => (
              <RaffleCardFromAddress
                key={raffleAddress}
                raffleAddress={raffleAddress}
                userAddress={address}
              />
            ))}
          </div>
        ) : (
          <RaffleGrid
            raffles={filteredRaffles}
            emptyMessage="No raffles found with the selected filters"
          />
        )}
      </div>
    </div>
  );
}
