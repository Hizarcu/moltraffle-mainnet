import { Raffle, RaffleStatus } from '@/lib/types/raffle';
import { parseEther } from 'viem';

/**
 * Mock raffle data for development and testing
 */
export const mockRaffles: Raffle[] = [
  {
    id: '1',
    title: 'Win 1 ETH Prize Pool',
    description: 'Enter for a chance to win the entire prize pool of 1 ETH!',
    prizeDescription: '1 ETH to the winner',
    prizeImageUrl: undefined,
    entryFee: parseEther('0.01'),
    entryFeeFormatted: '0.01 ETH',
    maxParticipants: 100,
    currentParticipants: 47,
    createdAt: new Date('2024-01-01'),
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: RaffleStatus.ACTIVE,
    participants: Array(47).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '0')}`),
    creator: '0x1234567890123456789012345678901234567890',
    contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    chainId: 1,
    totalPrizePool: parseEther('0.47'),
    totalPrizePoolFormatted: '0.47 ETH',
    prizePool: 0.47,
  },
  {
    id: '2',
    title: 'NFT Giveaway - Rare Digital Art',
    description: 'Win a rare NFT from the CryptoPunks collection',
    prizeDescription: 'CryptoPunk #1234 - Rare Alien Punk',
    prizeImageUrl: undefined,
    entryFee: parseEther('0.05'),
    entryFeeFormatted: '0.05 ETH',
    maxParticipants: 50,
    currentParticipants: 12,
    createdAt: new Date('2024-01-05'),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: RaffleStatus.ACTIVE,
    participants: Array(12).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '1')}`),
    creator: '0x2234567890123456789012345678901234567890',
    contractAddress: '0xbcdefabcdefabcdefabcdefabcdefabcdefabcde',
    chainId: 1,
    totalPrizePool: parseEther('0.6'),
    totalPrizePoolFormatted: '0.6 ETH',
    prizePool: 0.6,
  },
  {
    id: '3',
    title: 'Early Bird Special - 0.001 ETH Entry',
    description: 'Low entry fee raffle ending soon!',
    prizeDescription: '0.5 ETH Prize Pool',
    prizeImageUrl: undefined,
    entryFee: parseEther('0.001'),
    entryFeeFormatted: '0.001 ETH',
    maxParticipants: 200,
    currentParticipants: 156,
    createdAt: new Date('2024-01-10'),
    deadline: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    status: RaffleStatus.ACTIVE,
    participants: Array(156).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '2')}`),
    creator: '0x3234567890123456789012345678901234567890',
    contractAddress: '0xcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    chainId: 1,
    totalPrizePool: parseEther('0.156'),
    totalPrizePoolFormatted: '0.156 ETH',
    prizePool: 0.156,
  },
  {
    id: '4',
    title: 'Mega Raffle - 10 ETH Prize!',
    description: 'Our biggest raffle yet with a massive prize pool',
    prizeDescription: '10 ETH to one lucky winner',
    prizeImageUrl: undefined,
    entryFee: parseEther('0.1'),
    entryFeeFormatted: '0.1 ETH',
    maxParticipants: undefined,
    currentParticipants: 89,
    createdAt: new Date('2024-01-08'),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: RaffleStatus.ACTIVE,
    participants: Array(89).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '3')}`),
    creator: '0x4234567890123456789012345678901234567890',
    contractAddress: '0xdefabcdefabcdefabcdefabcdefabcdefabcdefa',
    chainId: 1,
    totalPrizePool: parseEther('8.9'),
    totalPrizePoolFormatted: '8.9 ETH',
    prizePool: 8.9,
  },
  {
    id: '5',
    title: 'Weekend Special Raffle',
    description: 'Special weekend raffle with guaranteed winner',
    prizeDescription: '2 ETH Prize',
    prizeImageUrl: undefined,
    entryFee: parseEther('0.02'),
    entryFeeFormatted: '0.02 ETH',
    maxParticipants: 100,
    currentParticipants: 100,
    createdAt: new Date('2024-01-12'),
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ended 1 day ago
    drawDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: RaffleStatus.DRAWN,
    participants: Array(100).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '4')}`),
    winner: '0x4444444444444444444444444444444444444444',
    winnerIndex: 42,
    vrfRequestId: '0xabcd1234',
    randomNumber: BigInt('424242424242'),
    creator: '0x5234567890123456789012345678901234567890',
    contractAddress: '0xefabcdefabcdefabcdefabcdefabcdefabcdefab',
    chainId: 1,
    totalPrizePool: parseEther('2'),
    totalPrizePoolFormatted: '2.0 ETH',
    prizePool: 2.0,
  },
  {
    id: '6',
    title: 'Community Raffle - Low Entry',
    description: 'Community-driven raffle with fair entry fee',
    prizeDescription: '1.5 ETH Community Prize',
    prizeImageUrl: undefined,
    entryFee: parseEther('0.015'),
    entryFeeFormatted: '0.015 ETH',
    maxParticipants: 100,
    currentParticipants: 23,
    createdAt: new Date('2024-01-15'),
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    status: RaffleStatus.ACTIVE,
    participants: Array(23).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '5')}`),
    creator: '0x6234567890123456789012345678901234567890',
    contractAddress: '0xfabcdefabcdefabcdefabcdefabcdefabcdefabc',
    chainId: 1,
    totalPrizePool: parseEther('0.345'),
    totalPrizePoolFormatted: '0.345 ETH',
    prizePool: 0.345,
  },
];

/**
 * Get raffles filtered by status
 */
export function getRafflesByStatus(status?: RaffleStatus): Raffle[] {
  if (!status) return mockRaffles;
  return mockRaffles.filter(r => r.status === status);
}

/**
 * Get raffle by ID
 */
export function getRaffleById(id: string): Raffle | undefined {
  return mockRaffles.find(r => r.id === id);
}

/**
 * Get featured raffles (for homepage)
 */
export function getFeaturedRaffles(count = 3): Raffle[] {
  return mockRaffles
    .filter(r => r.status === RaffleStatus.ACTIVE)
    .slice(0, count);
}
