'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUserRaffles } from '@/lib/contracts/hooks/useUserRaffles';
import { RaffleCardFromAddress } from '@/components/raffle/RaffleCardFromAddress';
import { mockRaffles } from '@/lib/utils/mockData';

export default function MyRafflesPage() {
  const [activeTab, setActiveTab] = useState('created');
  const { address, isConnected } = useAccount();
  const { createdRaffles, allRaffles, isLoading } = useUserRaffles();

  // Use blockchain data if available, otherwise fall back to mock data
  const hasBlockchainRaffles = createdRaffles.length > 0;

  // For demo: filter mock raffles by creator address (only used if no blockchain raffles)
  const userCreatedRaffles = mockRaffles.filter(
    (r) => r.creator.toLowerCase() === address?.toLowerCase()
  );

  const userParticipatedRaffles = mockRaffles.filter((r) =>
    r.participants.some((p) => p.toLowerCase() === address?.toLowerCase())
  );

  // For participated tab, we need to check all blockchain raffles
  const hasBlockchainData = allRaffles.length > 0;

  const tabs = [
    { id: 'created', label: 'Created' },
    { id: 'participated', label: 'Participated' },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">
            My <span className="text-gradient">Raffles</span>
          </h1>
          <p className="text-text-secondary mb-8">
            View raffles you've created and participated in
          </p>

          <EmptyState
            icon="🔌"
            title="Connect Your Wallet"
            description="Please connect your wallet to view your raffles"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">
          My <span className="text-gradient">Raffles</span>
        </h1>
        <p className="text-text-secondary mb-8">
          View raffles you've created and participated in
        </p>

        <div className="mb-8">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'created' && (
              <>
                {hasBlockchainRaffles ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdRaffles.map((raffleAddress) => (
                      <RaffleCardFromAddress
                        key={raffleAddress}
                        raffleAddress={raffleAddress}
                        userAddress={address}
                      />
                    ))}
                  </div>
                ) : userCreatedRaffles.length === 0 ? (
                  <EmptyState
                    icon="✨"
                    title="No Raffles Created Yet"
                    description="Start your first raffle and share it with the community"
                    actionLabel="Create Raffle"
                    actionHref="/create"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userCreatedRaffles.map((raffle) => (
                      <Card key={raffle.id} className="p-6 hover:border-purple-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-lg">{raffle.title}</h3>
                          <span
                            className={`
                              px-3 py-1 rounded-full text-xs font-medium
                              ${
                                raffle.status === 'active'
                                  ? 'bg-green-500/20 text-green-400'
                                  : raffle.status === 'drawn'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }
                            `}
                          >
                            {raffle.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                          {raffle.description}
                        </p>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Entry Fee</span>
                            <span className="font-medium">{raffle.entryFee} ETH</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Participants</span>
                            <span className="font-medium">
                              {raffle.currentParticipants}
                              {raffle.maxParticipants && raffle.maxParticipants > 0 && `/${raffle.maxParticipants}`}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Prize Pool</span>
                            <span className="font-medium text-green-400">
                              {raffle.prizePool} ETH
                            </span>
                          </div>
                        </div>

                        <a
                          href={`/room/${raffle.id}`}
                          className="block mt-4 text-center py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                        >
                          View Details
                        </a>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'participated' && (
              <>
                {hasBlockchainData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allRaffles.map((raffleAddress) => (
                      <RaffleCardFromAddress
                        key={raffleAddress}
                        raffleAddress={raffleAddress}
                        userAddress={address}
                        showOnlyIfParticipating={true}
                      />
                    ))}
                  </div>
                ) : userParticipatedRaffles.length === 0 ? (
                  <EmptyState
                    icon="🎟️"
                    title="No Participations Yet"
                    description="Browse available raffles and join one to get started"
                    actionLabel="Explore Raffles"
                    actionHref="/explore"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userParticipatedRaffles.map((raffle) => (
                      <Card key={raffle.id} className="p-6 hover:border-purple-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-lg">{raffle.title}</h3>
                          <span
                            className={`
                              px-3 py-1 rounded-full text-xs font-medium
                              ${
                                raffle.status === 'active'
                                  ? 'bg-green-500/20 text-green-400'
                                  : raffle.status === 'drawn'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }
                            `}
                          >
                            {raffle.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                          {raffle.description}
                        </p>

                        {raffle.status === 'drawn' && raffle.winner === address && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg">
                            <p className="text-yellow-400 font-medium text-center">
                              🎉 You Won!
                            </p>
                          </div>
                        )}

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Your Entry</span>
                            <span className="font-medium">{raffle.entryFee} ETH</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Prize Pool</span>
                            <span className="font-medium text-green-400">
                              {raffle.prizePool} ETH
                            </span>
                          </div>
                        </div>

                        <a
                          href={`/room/${raffle.id}`}
                          className="block mt-4 text-center py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                        >
                          View Details
                        </a>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
