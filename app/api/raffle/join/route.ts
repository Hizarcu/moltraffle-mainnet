import { NextRequest, NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/backend/blockchain';

// This API endpoint allows joining raffles via HTTP (backend wallet)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raffleAddress, ticketCount } = body;

    // Validate required fields
    if (!raffleAddress) {
      return NextResponse.json(
        { error: 'Missing raffleAddress' },
        { status: 400 }
      );
    }

    const tickets = ticketCount || 1;
    if (tickets < 1 || tickets > 100) {
      return NextResponse.json(
        { error: 'ticketCount must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Join raffle using backend wallet
    const blockchain = getBlockchainService();
    const result = await blockchain.joinRaffle(raffleAddress, tickets);

    return NextResponse.json({
      success: true,
      message: `Joined raffle with ${tickets} ticket(s)`,
      data: {
        raffleAddress,
        ticketCount: tickets,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        explorer: `https://sepolia.basescan.org/tx/${result.transactionHash}`,
      }
    });
  } catch (error: any) {
    console.error('Join raffle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join raffle' },
      { status: 500 }
    );
  }
}
