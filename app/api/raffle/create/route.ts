import { NextRequest, NextResponse } from 'next/server';
import { getBlockchainService } from '@/lib/backend/blockchain';

// This API endpoint allows agents to create raffles via HTTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, prizeDescription, entryFee, deadline, maxParticipants } = body;

    // Validate required fields
    if (!title || !description || !prizeDescription || !entryFee || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate entryFee is a valid number
    if (isNaN(parseFloat(entryFee)) || parseFloat(entryFee) <= 0) {
      return NextResponse.json(
        { error: 'Invalid entry fee' },
        { status: 400 }
      );
    }

    // Validate deadline is a valid date in the future
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return NextResponse.json(
        { error: 'Invalid deadline - must be a future date' },
        { status: 400 }
      );
    }

    // Create raffle on blockchain
    const blockchain = getBlockchainService();
    const result = await blockchain.createRaffle({
      title,
      description,
      prizeDescription,
      entryFee,
      deadline,
      maxParticipants: maxParticipants || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Raffle created successfully on Base Sepolia',
      data: {
        title,
        description,
        entryFee,
        deadline,
        maxParticipants: maxParticipants || 0,
        transactionHash: result.transactionHash,
        raffleAddress: result.raffleAddress,
        blockNumber: result.blockNumber,
        explorer: `https://sepolia.basescan.org/tx/${result.transactionHash}`,
      }
    });
  } catch (error: any) {
    console.error('Create raffle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create raffle' },
      { status: 500 }
    );
  }
}
