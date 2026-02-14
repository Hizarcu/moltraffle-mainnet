/**
 * Raffle status enum
 */
export enum RaffleStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  DRAWN = 'drawn',
  CANCELLED = 'cancelled',
}

/**
 * Main Raffle type
 */
export interface Raffle {
  id: string;
  title: string;
  description: string;
  prizeDescription: string;
  prizeImageUrl?: string;

  // Entry details
  entryFee: bigint;
  entryFeeFormatted: string; // For display (e.g., "$1.00 USDC")
  maxParticipants?: number;
  currentParticipants: number;

  // Timeline
  createdAt: Date;
  deadline: Date;
  drawDate?: Date;

  // Status
  status: RaffleStatus;

  // Participants
  participants: string[]; // Array of wallet addresses

  // Winner (if drawn)
  winner?: string;
  winnerIndex?: number;
  vrfRequestId?: string;
  randomNumber?: bigint;

  // Creator
  creator: string;
  creatorCommissionBps?: number;

  // Blockchain details
  contractAddress: string;
  chainId: number;
  transactionHash?: string;

  // Prize pool
  totalPrizePool: bigint;
  totalPrizePoolFormatted: string;
  prizePool: number; // Convenience: prize pool in USDC as number
}

/**
 * Raffle creation form data
 */
export interface CreateRaffleFormData {
  title: string;
  description: string;
  prizeDescription: string;
  prizeImageUrl?: string;
  entryFee: string;
  maxParticipants?: number;
  deadline: Date;
}

/**
 * Raffle filter options
 */
export interface RaffleFilters {
  status?: RaffleStatus[];
  minEntryFee?: number;
  maxEntryFee?: number;
  sortBy?: 'deadline' | 'participants' | 'prizePool' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

/**
 * Participant type
 */
export interface Participant {
  address: string;
  ensName?: string;
  joinedAt: Date;
  transactionHash: string;
}

/**
 * VRF Proof details for transparency
 */
export interface VRFProof {
  requestId: string;
  randomNumber: bigint;
  blockNumber: number;
  blockHash: string;
  timestamp: Date;
  explorerUrl: string;
}
