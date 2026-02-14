import { Raffle, RaffleStatus } from '@/lib/types/raffle';
import { parseUnits } from 'viem';

/**
 * Mock raffle data for development and testing (USDC, 6 decimals)
 */
export const mockRaffles: Raffle[] = [
  {
    id: '1',
    title: 'Win $100 USDC Prize Pool',
    description: 'Enter for a chance to win the entire prize pool of $100 USDC!',
    prizeDescription: '$100 USDC to the winner',
    prizeImageUrl: undefined,
    entryFee: parseUnits('1', 6),
    entryFeeFormatted: '$1.00 USDC',
    maxParticipants: 100,
    currentParticipants: 47,
    createdAt: new Date('2024-01-01'),
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: RaffleStatus.ACTIVE,
    participants: Array(47).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '0')}`),
    creator: '0x1234567890123456789012345678901234567890',
    contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    chainId: 8453,
    totalPrizePool: parseUnits('47', 6),
    totalPrizePoolFormatted: '$47.00 USDC',
    prizePool: 47,
  },
  {
    id: '2',
    title: 'NFT Giveaway - Rare Digital Art',
    description: 'Win a rare NFT from the CryptoPunks collection',
    prizeDescription: 'CryptoPunk #1234 - Rare Alien Punk',
    prizeImageUrl: undefined,
    entryFee: parseUnits('5', 6),
    entryFeeFormatted: '$5.00 USDC',
    maxParticipants: 50,
    currentParticipants: 12,
    createdAt: new Date('2024-01-05'),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: RaffleStatus.ACTIVE,
    participants: Array(12).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '1')}`),
    creator: '0x2234567890123456789012345678901234567890',
    contractAddress: '0xbcdefabcdefabcdefabcdefabcdefabcdefabcde',
    chainId: 8453,
    totalPrizePool: parseUnits('60', 6),
    totalPrizePoolFormatted: '$60.00 USDC',
    prizePool: 60,
  },
  {
    id: '3',
    title: 'Early Bird Special - $0.10 USDC Entry',
    description: 'Low entry fee raffle ending soon!',
    prizeDescription: '$50 USDC Prize Pool',
    prizeImageUrl: undefined,
    entryFee: parseUnits('0.1', 6),
    entryFeeFormatted: '$0.10 USDC',
    maxParticipants: 200,
    currentParticipants: 156,
    createdAt: new Date('2024-01-10'),
    deadline: new Date(Date.now() + 3 * 60 * 60 * 1000),
    status: RaffleStatus.ACTIVE,
    participants: Array(156).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '2')}`),
    creator: '0x3234567890123456789012345678901234567890',
    contractAddress: '0xcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    chainId: 8453,
    totalPrizePool: parseUnits('15.6', 6),
    totalPrizePoolFormatted: '$15.60 USDC',
    prizePool: 15.6,
  },
  {
    id: '4',
    title: 'Mega Raffle - $10,000 USDC Prize!',
    description: 'Our biggest raffle yet with a massive prize pool',
    prizeDescription: '$10,000 USDC to one lucky winner',
    prizeImageUrl: undefined,
    entryFee: parseUnits('100', 6),
    entryFeeFormatted: '$100.00 USDC',
    maxParticipants: undefined,
    currentParticipants: 89,
    createdAt: new Date('2024-01-08'),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: RaffleStatus.ACTIVE,
    participants: Array(89).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '3')}`),
    creator: '0x4234567890123456789012345678901234567890',
    contractAddress: '0xdefabcdefabcdefabcdefabcdefabcdefabcdefa',
    chainId: 8453,
    totalPrizePool: parseUnits('8900', 6),
    totalPrizePoolFormatted: '$8,900.00 USDC',
    prizePool: 8900,
  },
  {
    id: '5',
    title: 'Weekend Special Raffle',
    description: 'Special weekend raffle with guaranteed winner',
    prizeDescription: '$200 USDC Prize',
    prizeImageUrl: undefined,
    entryFee: parseUnits('2', 6),
    entryFeeFormatted: '$2.00 USDC',
    maxParticipants: 100,
    currentParticipants: 100,
    createdAt: new Date('2024-01-12'),
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    drawDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: RaffleStatus.DRAWN,
    participants: Array(100).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '4')}`),
    winner: '0x4444444444444444444444444444444444444444',
    winnerIndex: 42,
    vrfRequestId: '0xabcd1234',
    randomNumber: BigInt('424242424242'),
    creator: '0x5234567890123456789012345678901234567890',
    contractAddress: '0xefabcdefabcdefabcdefabcdefabcdefabcdefab',
    chainId: 8453,
    totalPrizePool: parseUnits('200', 6),
    totalPrizePoolFormatted: '$200.00 USDC',
    prizePool: 200,
  },
  {
    id: '6',
    title: 'Community Raffle - Low Entry',
    description: 'Community-driven raffle with fair entry fee',
    prizeDescription: '$150 USDC Community Prize',
    prizeImageUrl: undefined,
    entryFee: parseUnits('1.5', 6),
    entryFeeFormatted: '$1.50 USDC',
    maxParticipants: 100,
    currentParticipants: 23,
    createdAt: new Date('2024-01-15'),
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    status: RaffleStatus.ACTIVE,
    participants: Array(23).fill('0x').map((_, i) => `0x${i.toString().padStart(40, '5')}`),
    creator: '0x6234567890123456789012345678901234567890',
    contractAddress: '0xfabcdefabcdefabcdefabcdefabcdefabcdefabc',
    chainId: 8453,
    totalPrizePool: parseUnits('34.5', 6),
    totalPrizePoolFormatted: '$34.50 USDC',
    prizePool: 34.5,
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
