'use client';

import { useState } from 'react';
import { RaffleGrid } from '@/components/raffle/RaffleGrid';
import { Badge } from '@/components/ui/Badge';
import { RaffleStatus } from '@/lib/types/raffle';
import { mockRaffles } from '@/lib/utils/mockData';
import { useAllRaffles } from '@/lib/contracts/hooks/useAllRaffles';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function ExplorePage() {
  const [selectedStatus, setSelectedStatus] = useState<RaffleStatus | 'all'>('all');
  const { raffleAddresses, isLoading } = useAllRaffles();

  // Use mock data for now (will switch to blockchain data once we have raffles)
  const hasBlockchainRaffles = raffleAddresses && raffleAddresses.length > 0;
  const displayRaffles = hasBlockchainRaffles ? [] : mockRaffles; // TODO: Fetch actual raffle data for each address

  // Filter raffles by status
  const filteredRaffles = selectedStatus === 'all'
    ? displayRaffles
    : displayRaffles.filter(r => r.status === selectedStatus);

  const statusFilters = [
    { value: 'all' as const, label: 'All Raffles', count: displayRaffles.length },
    { value: RaffleStatus.ACTIVE, label: 'Active', count: displayRaffles.filter(r => r.status === RaffleStatus.ACTIVE).length },
    { value: RaffleStatus.ENDED, label: 'Ended', count: displayRaffles.filter(r => r.status === RaffleStatus.ENDED).length },
    { value: RaffleStatus.DRAWN, label: 'Drawn', count: displayRaffles.filter(r => r.status === RaffleStatus.DRAWN).length },
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
            Showing {filteredRaffles.length} {filteredRaffles.length === 1 ? 'raffle' : 'raffles'}
          </p>
        </div>

        {/* Raffle Grid */}
        <RaffleGrid
          raffles={filteredRaffles}
          emptyMessage="No raffles found with the selected filters"
        />
      </div>
    </div>
  );
}
