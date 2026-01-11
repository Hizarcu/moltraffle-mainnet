'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUserRaffles } from '@/lib/contracts/hooks/useUserRaffles';
import { RaffleCardFromAddress } from '@/components/raffle/RaffleCardFromAddress';

export default function MyRafflesPage() {
  const [activeTab, setActiveTab] = useState('created');
  const { address, isConnected } = useAccount();
  const { createdRaffles, allRaffles, isLoading } = useUserRaffles();

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
                {createdRaffles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdRaffles.map((raffleAddress) => (
                      <RaffleCardFromAddress
                        key={raffleAddress}
                        raffleAddress={raffleAddress}
                        userAddress={address}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="✨"
                    title="No Raffles Created Yet"
                    description="Start your first raffle and share it with the community"
                    actionLabel="Create Raffle"
                    actionHref="/create"
                  />
                )}
              </>
            )}

            {activeTab === 'participated' && (
              <>
                {allRaffles.length > 0 ? (
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
                ) : (
                  <EmptyState
                    icon="🎟️"
                    title="No Participations Yet"
                    description="Browse available raffles and join one to get started"
                    actionLabel="Explore Raffles"
                    actionHref="/explore"
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
