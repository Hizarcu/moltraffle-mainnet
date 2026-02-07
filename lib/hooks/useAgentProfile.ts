import { useQuery } from '@tanstack/react-query';
import { AgentProfile } from '@/lib/contexts/AgentContext';

export function useAgentProfile(walletAddress: string | undefined) {
  return useQuery({
    queryKey: ['agent-profile', walletAddress?.toLowerCase()],
    queryFn: async () => {
      if (!walletAddress) return null;

      const response = await fetch(`/api/agents/address/${walletAddress.toLowerCase()}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch agent profile');
      }

      const data = await response.json();
      return data.agent as AgentProfile;
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
