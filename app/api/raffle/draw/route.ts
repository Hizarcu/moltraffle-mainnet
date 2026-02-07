import { NextRequest, NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/backend/blockchain';

// This API endpoint draws a winner for a raffle using Chainlink VRF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raffleAddress } = body;

    // Validate required fields
    if (!raffleAddress) {
      return NextResponse.json(
        { error: 'Missing raffleAddress' },
        { status: 400 }
      );
    }

    // Draw winner using VRF
    const blockchain = getBlockchainService();
    const result = await blockchain.drawWinner(raffleAddress);

    return NextResponse.json({
      success: true,
      message: 'Winner draw initiated - waiting for Chainlink VRF',
      data: {
        raffleAddress,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        vrfRequestId: result.vrfRequestId,
        explorer: `https://sepolia.basescan.org/tx/${result.transactionHash}`,
        note: 'VRF will fulfill in 1-2 minutes. Check raffle page for winner.',
      }
    });
  } catch (error: any) {
    console.error('Draw winner error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to draw winner' },
      { status: 500 }
    );
  }
}
