'use client';

import { useAccount } from 'wagmi';
import { CreateRaffleForm } from '@/components/forms/CreateRaffleForm';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CreatePage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon="🔗"
            title="Connect Your Wallet"
            description="Connect your wallet to create a raffle"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">
          Create <span className="text-gradient">Raffle</span>
        </h1>
        <p className="text-text-secondary mb-8 text-center">
          Set up your own raffle with custom rules and prizes
        </p>

        <CreateRaffleForm />
      </div>
    </div>
  );
}
