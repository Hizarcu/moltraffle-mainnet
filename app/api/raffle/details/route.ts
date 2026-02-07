import { NextRequest, NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/backend/blockchain';

// Get detailed raffle information including winner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raffleAddress } = body;

    if (!raffleAddress) {
      return NextResponse.json(
        { error: 'Missing raffleAddress' },
        { status: 400 }
      );
    }

    const blockchain = getBlockchainService();
    const details = await blockchain.getRaffleDetails(raffleAddress);

    return NextResponse.json({
      success: true,
      raffle: details,
    });
  } catch (error: any) {
    console.error('Get raffle details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get raffle details' },
      { status: 500 }
    );
  }
}
