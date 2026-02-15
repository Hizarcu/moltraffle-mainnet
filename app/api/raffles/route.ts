import { NextRequest, NextResponse } from 'next/server';
import { formatUnits, isAddress } from 'viem';
import { publicClient } from '@/lib/contracts/client';
import { RaffleFactoryABI } from '@/lib/contracts/abis/RaffleFactory';
import { RaffleABI } from '@/lib/contracts/abis/Raffle';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

const FACTORY_ADDRESS = CONTRACT_ADDRESSES[8453].RaffleFactory as `0x${string}`;

const STATUS_LABELS: Record<number, string> = {
  0: 'UPCOMING',
  1: 'ACTIVE',
  2: 'ENDED',
  3: 'DRAWN',
  4: 'CANCELLED',
  5: 'CLAIMED',
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
    const statusFilter = searchParams.get('status')?.toLowerCase();
    const creatorFilter = searchParams.get('creator');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    if (creatorFilter && !isAddress(creatorFilter)) {
      return NextResponse.json(
        { error: 'Invalid creator address' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get raffle addresses from factory
    let raffleAddresses: `0x${string}`[];
    if (creatorFilter) {
      raffleAddresses = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: RaffleFactoryABI,
        functionName: 'getRafflesByCreator',
        args: [creatorFilter as `0x${string}`],
      })) as `0x${string}`[];
    } else {
      raffleAddresses = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: RaffleFactoryABI,
        functionName: 'getAllRaffles',
      })) as `0x${string}`[];
    }

    if (raffleAddresses.length === 0) {
      return NextResponse.json(
        { raffles: [], total: 0, limit, offset },
        { headers: { ...corsHeaders, 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } }
      );
    }

    // Multicall: getRaffleDetails + getPrizePool + prizeDescription for each raffle
    const contracts = raffleAddresses.flatMap((address) => [
      { address, abi: RaffleABI, functionName: 'getRaffleDetails' as const },
      { address, abi: RaffleABI, functionName: 'getPrizePool' as const },
      { address, abi: RaffleABI, functionName: 'prizeDescription' as const },
    ]);

    const results = await publicClient.multicall({ contracts });

    // Parse results in groups of 3
    const raffles = [];
    for (let i = 0; i < raffleAddresses.length; i++) {
      const detailsResult = results[i * 3];
      const prizePoolResult = results[i * 3 + 1];
      const prizeDescResult = results[i * 3 + 2];

      if (detailsResult.status !== 'success' || prizePoolResult.status !== 'success') {
        continue; // Skip failed reads
      }

      const details = detailsResult.result as [
        string, string, bigint, bigint, bigint, bigint, number, `0x${string}`, `0x${string}`, bigint
      ];

      const [
        title, description, entryFee, deadline, maxParticipants,
        currentParticipants, status, creator, winner, creatorCommissionBps,
      ] = details;

      const contractStatusNum = Number(status);
      const deadlineNum = Number(deadline);
      const now = Math.floor(Date.now() / 1000);
      const hasWinner = winner !== ZERO_ADDRESS;

      // Override status with actual state (mirrors frontend logic)
      let statusNum: number;
      if (contractStatusNum === 4) {
        statusNum = 4; // CANCELLED
      } else if (contractStatusNum === 5) {
        statusNum = 5; // CLAIMED
      } else if (hasWinner) {
        statusNum = 3; // DRAWN
      } else if (deadlineNum <= now) {
        statusNum = 2; // ENDED
      } else {
        statusNum = 1; // ACTIVE
      }
      const statusLabel = STATUS_LABELS[statusNum] || 'UNKNOWN';

      // Apply status filter
      if (statusFilter && statusLabel.toLowerCase() !== statusFilter) {
        continue;
      }

      const prizePool = prizePoolResult.result as bigint;
      const prizeDesc = prizeDescResult.status === 'success'
        ? prizeDescResult.result as string
        : '';

      const entryFeeStr = entryFee.toString();
      const prizePoolStr = prizePool.toString();
      const ticketsSold = Number(currentParticipants);

      const entryFeeUsdc = parseFloat(formatUnits(entryFee, 6));
      const prizePoolUsdc = parseFloat(formatUnits(prizePool, 6));

      // Original prize pool (useful for CLAIMED raffles where on-chain balance is 0)
      const originalPrizePoolRaw = entryFee * BigInt(ticketsSold);
      const originalPrizePoolUsdc = parseFloat(formatUnits(originalPrizePoolRaw, 6));

      raffles.push({
        address: raffleAddresses[i],
        title,
        description,
        prizeDescription: prizeDesc,
        entryFee: entryFeeStr,
        entryFeeFormatted: `$${entryFeeUsdc.toFixed(2)} USDC`,
        deadline: deadlineNum,
        deadlineISO: new Date(deadlineNum * 1000).toISOString(),
        maxTickets: Number(maxParticipants),
        ticketsSold,
        status: statusNum,
        statusLabel,
        creator,
        winner: winner === ZERO_ADDRESS ? null : winner,
        creatorCommissionBps: Number(creatorCommissionBps),
        prizePool: prizePoolStr,
        prizePoolFormatted: `$${prizePoolUsdc.toFixed(2)} USDC`,
        originalPrizePool: originalPrizePoolRaw.toString(),
        originalPrizePoolFormatted: `$${originalPrizePoolUsdc.toFixed(2)} USDC`,
      });
    }

    // Sort by deadline descending (most recent first)
    raffles.sort((a, b) => b.deadline - a.deadline);

    // Paginate
    const total = raffles.length;
    const paginated = raffles.slice(offset, offset + limit);

    return NextResponse.json(
      { raffles: paginated, total, limit, offset },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching raffles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch raffles from chain' },
      { status: 502, headers: corsHeaders }
    );
  }
}
