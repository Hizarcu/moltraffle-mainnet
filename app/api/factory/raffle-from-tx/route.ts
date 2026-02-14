import { NextRequest, NextResponse } from 'next/server';
import { decodeEventLog, isHash } from 'viem';
import { publicClient } from '@/lib/contracts/client';
import { RaffleFactoryABI } from '@/lib/contracts/abis/RaffleFactory';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');

    if (!txHash || !isHash(txHash)) {
      return NextResponse.json(
        { error: 'txHash: required, must be a valid transaction hash (0x...)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Transaction not found or not yet confirmed' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (receipt.status === 'reverted') {
      return NextResponse.json(
        { error: 'Transaction reverted — raffle was not created' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find RaffleCreated event in logs
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: RaffleFactoryABI,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'RaffleCreated') {
          const args = decoded.args as {
            raffleAddress: `0x${string}`;
            creator: `0x${string}`;
            title: string;
            entryFee: bigint;
            deadline: bigint;
            maxParticipants: bigint;
            creatorCommissionBps: bigint;
          };
          return NextResponse.json({
            raffleAddress: args.raffleAddress,
            creator: args.creator,
            title: args.title,
            blockNumber: Number(receipt.blockNumber),
            txHash,
          }, {
            headers: { ...corsHeaders, 'Cache-Control': 'public, s-maxage=3600' },
          });
        }
      } catch {
        // Not a RaffleCreated event, skip
      }
    }

    return NextResponse.json(
      { error: 'No RaffleCreated event found in transaction — this may not be a raffle creation tx' },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error looking up raffle from tx:', error);
    return NextResponse.json(
      { error: 'Failed to look up transaction' },
      { status: 502, headers: corsHeaders }
    );
  }
}
