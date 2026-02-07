import { NextRequest, NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/backend/blockchain';

// This API endpoint returns all raffles
export async function GET(request: NextRequest) {
  try {
    const blockchain = getBlockchainService();

    // Get all raffle addresses
    const raffleAddresses = await blockchain.getAllRaffles();
    const count = await blockchain.getRaffleCount();

    return NextResponse.json({
      success: true,
      raffles: raffleAddresses,
      count: count,
      network: 'Base Sepolia',
      chainId: 84532,
    });
  } catch (error: any) {
    console.error('List raffles error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch raffles' },
      { status: 500 }
    );
  }
}
