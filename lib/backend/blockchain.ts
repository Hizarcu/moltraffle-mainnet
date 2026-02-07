import { ethers } from 'ethers';
import { RaffleFactoryABI } from '../contracts/abis/RaffleFactory';

// Backend blockchain service for server-side transactions
class BlockchainService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private factoryContract: ethers.Contract;

  constructor() {
    // Initialize provider
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialize wallet (backend wallet for transactions)
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not set in environment');
    }
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Initialize contract
    const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS_BASE_SEPOLIA;
    if (!factoryAddress) {
      throw new Error('FACTORY_ADDRESS_BASE_SEPOLIA not set');
    }
    this.factoryContract = new ethers.Contract(
      factoryAddress,
      RaffleFactoryABI,
      this.wallet
    );
  }

  // Create a new raffle
  async createRaffle(params: {
    title: string;
    description: string;
    prizeDescription: string;
    entryFee: string; // in ETH
    deadline: string; // ISO date string
    maxParticipants: number;
  }) {
    try {
      const entryFeeWei = ethers.parseEther(params.entryFee);
      const deadlineTimestamp = Math.floor(new Date(params.deadline).getTime() / 1000);

      console.log('Creating raffle:', {
        title: params.title,
        entryFee: entryFeeWei.toString(),
        deadline: deadlineTimestamp,
      });

      // Call contract
      const tx = await this.factoryContract.createRaffle(
        params.title,
        params.description,
        params.prizeDescription,
        entryFeeWei,
        deadlineTimestamp,
        params.maxParticipants
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Get the raffle address from the event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.factoryContract.interface.parseLog(log);
          return parsed?.name === 'RaffleCreated';
        } catch {
          return false;
        }
      });

      let raffleAddress = null;
      if (event) {
        const parsed = this.factoryContract.interface.parseLog(event);
        raffleAddress = parsed?.args?.raffleAddress;
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        raffleAddress,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error('Error creating raffle:', error);
      throw new Error(`Failed to create raffle: ${error.message}`);
    }
  }

  // Get all raffles
  async getAllRaffles() {
    try {
      const raffles = await this.factoryContract.getAllRaffles();
      return raffles;
    } catch (error: any) {
      console.error('Error getting raffles:', error);
      throw new Error(`Failed to get raffles: ${error.message}`);
    }
  }

  // Get raffle count
  async getRaffleCount() {
    try {
      const count = await this.factoryContract.getRaffleCount();
      return Number(count);
    } catch (error: any) {
      console.error('Error getting raffle count:', error);
      throw new Error(`Failed to get raffle count: ${error.message}`);
    }
  }

  // Get raffles by creator
  async getRafflesByCreator(creator: string) {
    try {
      const raffles = await this.factoryContract.getRafflesByCreator(creator);
      return raffles;
    } catch (error: any) {
      console.error('Error getting raffles by creator:', error);
      throw new Error(`Failed to get raffles: ${error.message}`);
    }
  }

  // Get wallet balance
  async getBalance() {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      console.error('Error getting balance:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  // Get wallet address
  getWalletAddress() {
    return this.wallet.address;
  }

  // Join a raffle with multiple tickets
  async joinRaffle(raffleAddress: string, ticketCount: number) {
    try {
      const { RaffleABI } = await import('../contracts/abis/Raffle');
      const raffleContract = new ethers.Contract(raffleAddress, RaffleABI, this.wallet);

      // Get entry fee
      const entryFee = await raffleContract.entryFee();
      const totalCost = entryFee * BigInt(ticketCount);

      console.log('Joining raffle:', {
        address: raffleAddress,
        ticketCount,
        entryFee: ethers.formatEther(entryFee),
        totalCost: ethers.formatEther(totalCost),
      });

      // Join raffle
      const tx = await raffleContract.joinRaffle(ticketCount, { value: totalCost });
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        ticketCount,
      };
    } catch (error: any) {
      console.error('Error joining raffle:', error);
      throw new Error(`Failed to join raffle: ${error.message}`);
    }
  }

  // Draw winner for a raffle
  async drawWinner(raffleAddress: string) {
    try {
      const { RaffleABI } = await import('../contracts/abis/Raffle');
      const raffleContract = new ethers.Contract(raffleAddress, RaffleABI, this.wallet);

      console.log('Drawing winner for raffle:', raffleAddress);

      const tx = await raffleContract.drawWinner();
      console.log('Draw winner transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Draw winner confirmed:', receipt.hash);

      // Get VRF request ID from logs
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = raffleContract.interface.parseLog(log);
          return parsed?.name === 'RandomnessRequested';
        } catch {
          return false;
        }
      });

      let vrfRequestId = null;
      if (event) {
        const parsed = raffleContract.interface.parseLog(event);
        vrfRequestId = parsed?.args?.requestId?.toString();
      }

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        vrfRequestId,
      };
    } catch (error: any) {
      console.error('Error drawing winner:', error);
      throw new Error(`Failed to draw winner: ${error.message}`);
    }
  }

  // Get raffle details
  async getRaffleDetails(raffleAddress: string) {
    try {
      const { RaffleABI } = await import('../contracts/abis/Raffle');
      const raffleContract = new ethers.Contract(raffleAddress, RaffleABI, this.provider);

      const details = await raffleContract.getRaffleDetails();
      const participants = await raffleContract.getParticipants();
      const totalTickets = await raffleContract.getTotalTickets();

      return {
        title: details[0],
        description: details[1],
        entryFee: ethers.formatEther(details[2]),
        deadline: new Date(Number(details[3]) * 1000).toISOString(),
        maxParticipants: Number(details[4]),
        currentParticipants: Number(details[5]),
        status: Number(details[6]),
        creator: details[7],
        winner: details[8],
        participants,
        totalTickets: Number(totalTickets),
      };
    } catch (error: any) {
      console.error('Error getting raffle details:', error);
      throw new Error(`Failed to get raffle details: ${error.message}`);
    }
  }
}

// Singleton instance
let blockchainService: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!blockchainService) {
    blockchainService = new BlockchainService();
  }
  return blockchainService;
}
