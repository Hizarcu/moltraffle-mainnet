'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { RaffleCardFromAddress } from '@/components/raffle/RaffleCardFromAddress';
import { useAllRafflesSortable, SortableRaffleData } from '@/lib/contracts/hooks/useAllRaffles';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type SortKey = 'none' | 'entryFee' | 'expectedPrizePool' | 'creatorCommissionBps';
type SortDir = 'asc' | 'desc';

function matchesStatusFilter(status: number, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return status === 0;
  if (filter === 'ended') return status === 1;
  // "completed" includes DRAWN (2), CANCELLED (4), CLAIMED (5)
  if (filter === 'completed') return status === 2 || status === 4 || status === 5;
  return true;
}

export default function ExplorePage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'ended' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('none');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { address } = useAccount();
  const { raffleAddresses, sortableData, isLoading } = useAllRafflesSortable();

  const hasBlockchainRaffles = raffleAddresses && raffleAddresses.length > 0;

  // Build a lookup map: address -> SortableRaffleData
  const dataByAddress = useMemo(() => {
    const map = new Map<string, SortableRaffleData>();
    for (const item of sortableData) {
      map.set(item.address.toLowerCase(), item);
    }
    return map;
  }, [sortableData]);

  // Filter by status tab, then sort
  const filteredSortedAddresses = useMemo(() => {
    // If multicall data hasn't loaded yet, return raw addresses (cards will handle their own loading)
    if (sortableData.length === 0 && raffleAddresses.length > 0) {
      return raffleAddresses;
    }

    // Filter
    let filtered = raffleAddresses.filter((addr) => {
      const data = dataByAddress.get(addr.toLowerCase());
      if (!data) return true; // show if data not loaded yet
      return matchesStatusFilter(data.actualStatus, selectedStatus);
    });

    // Sort
    if (sortBy !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        const da = dataByAddress.get(a.toLowerCase());
        const db = dataByAddress.get(b.toLowerCase());
        if (!da || !db) return 0;

        let cmp: number;
        if (sortBy === 'entryFee') {
          cmp = da.entryFee < db.entryFee ? -1 : da.entryFee > db.entryFee ? 1 : 0;
        } else if (sortBy === 'expectedPrizePool') {
          cmp = da.expectedPrizePool < db.expectedPrizePool ? -1 : da.expectedPrizePool > db.expectedPrizePool ? 1 : 0;
        } else {
          cmp = da.creatorCommissionBps - db.creatorCommissionBps;
        }

        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return filtered;
  }, [raffleAddresses, sortableData, dataByAddress, selectedStatus, sortBy, sortDir]);

  const statusFilters = [
    { value: 'all' as const, label: 'All Raffles' },
    { value: 'active' as const, label: 'Active' },
    { value: 'ended' as const, label: 'Ended' },
    { value: 'completed' as const, label: 'Completed' },
  ];

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'none', label: 'Default' },
    { value: 'entryFee', label: 'Entry Fee' },
    { value: 'expectedPrizePool', label: 'Prize Pool' },
    { value: 'creatorCommissionBps', label: 'Commission' },
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

        {/* Filters + Sort */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
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

            {/* Sort Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-4 py-3 rounded-lg bg-background-secondary text-text-secondary border border-white/10 font-medium focus:outline-none focus:border-purple-500/50"
                style={{ colorScheme: 'dark' }}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {sortBy !== 'none' && (
                <button
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  className="px-4 py-3 rounded-lg bg-background-secondary text-text-secondary hover:bg-background-tertiary border border-white/10 font-medium transition-all"
                  title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortDir === 'asc' ? '↑ Low first' : '↓ High first'}
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Raffle Display */}
        {hasBlockchainRaffles ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSortedAddresses.map((raffleAddress) => (
                <RaffleCardFromAddress
                  key={raffleAddress}
                  raffleAddress={raffleAddress}
                  userAddress={address}
                  filterStatus="all"
                />
              ))}
            </div>
            {filteredSortedAddresses.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-text-secondary text-lg">
                  No {selectedStatus === 'all' ? '' : selectedStatus} raffles found
                </p>
              </div>
            )}
          </>
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
