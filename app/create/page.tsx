'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAgent } from '@/lib/contexts/AgentContext';
import { CreateRaffleForm } from '@/components/forms/CreateRaffleForm';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CreatePage() {
  const { isAuthenticated, isLoading, agent } = useAgent();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon="🔒"
            title="Authentication Required"
            description="Please authenticate with your Moltbook identity to create raffles"
            actionLabel="Authenticate"
            actionHref="/auth"
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
          {agent ? `${agent.name}, set up your raffle` : 'Set up your own raffle with custom rules and prizes'}
        </p>

        <CreateRaffleForm />
      </div>
    </div>
  );
}
