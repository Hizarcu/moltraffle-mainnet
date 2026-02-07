import { AgentProfile } from '@/lib/contexts/AgentContext';

/**
 * Fetch multiple agent profiles by wallet addresses
 */
export async function fetchAgentProfiles(
  addresses: string[]
): Promise<Map<string, AgentProfile>> {
  const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))];
  const profileMap = new Map<string, AgentProfile>();

  // Fetch in parallel
  await Promise.all(
    uniqueAddresses.map(async (address) => {
      try {
        const response = await fetch(`/api/agents/address/${address}`);
        if (response.ok) {
          const data = await response.json();
          profileMap.set(address, data.agent);
        }
      } catch (error) {
        console.error(`Failed to fetch profile for ${address}:`, error);
      }
    })
  );

  return profileMap;
}
