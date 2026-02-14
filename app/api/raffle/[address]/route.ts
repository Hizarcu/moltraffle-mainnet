import { NextRequest, NextResponse } from 'next/server';
import { formatUnits, isAddress, encodeFunctionData } from 'viem';
import { publicClient } from '@/lib/contracts/client';
import { RaffleABI } from '@/lib/contracts/abis/Raffle';
import { RaffleFactoryABI } from '@/lib/contracts/abis/RaffleFactory';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

const FACTORY_ADDRESS = CONTRACT_ADDRESSES[8453].RaffleFactory;

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

function buildActions(
  raffleAddress: `0x${string}`,
  statusNum: number,
  deadlineNum: number,
  maxTickets: number,
  currentTickets: number,
  entryFee: bigint,
  ticketCount: number = 1,
) {
  const now = Math.floor(Date.now() / 1000);
  const deadlinePassed = now >= deadlineNum;
  const isFull = maxTickets > 0 && currentTickets >= maxTickets;

  // Join action — now targets Factory.joinRaffle
  const joinAction: Record<string, unknown> = (() => {
    if (statusNum === 4 || statusNum === 5) {
      return { available: false, reason: 'Raffle is cancelled or claimed' };
    }
    if (statusNum === 2 || statusNum === 3) {
      return { available: false, reason: 'Raffle draw already initiated' };
    }
    if (statusNum !== 0 && statusNum !== 1) {
      return { available: false, reason: 'Raffle not active' };
    }
    if (deadlinePassed) {
      return { available: false, reason: 'Deadline has passed' };
    }
    if (isFull) {
      return { available: false, reason: 'Raffle is full' };
    }
    const totalCost = entryFee * BigInt(ticketCount);
    const totalCostUsdc = parseFloat(formatUnits(totalCost, 6));
    return {
      available: true,
      to: FACTORY_ADDRESS,
      function: 'joinRaffle(address,uint256)',
      args: { raffle: raffleAddress, ticketCount },
      value: '0',
      totalCost: totalCost.toString(),
      totalCostFormatted: `$${totalCostUsdc.toFixed(2)} USDC`,
      calldata: encodeFunctionData({
        abi: RaffleFactoryABI,
        functionName: 'joinRaffle',
        args: [raffleAddress, BigInt(ticketCount)],
      }),
      note: `Requires $${totalCostUsdc.toFixed(2)} USDC allowance on Factory. Use ?ticketCount=N to change.`,
      approval: {
        note: 'Caller must have approved Factory for USDC spending (one-time)',
        factoryAddress: FACTORY_ADDRESS,
      },
    };
  })();

  // Draw action
  const drawAction: Record<string, unknown> = (() => {
    if (statusNum !== 0 && statusNum !== 1) {
      return { available: false, reason: 'Draw already initiated or raffle not active' };
    }
    if (currentTickets < 2) {
      return { available: false, reason: 'Need at least 2 tickets sold' };
    }
    if (!deadlinePassed && !isFull) {
      return { available: false, reason: 'Deadline not reached and raffle not full' };
    }
    return {
      available: true,
      to: raffleAddress,
      function: 'drawWinner()',
      value: '0',
      calldata: encodeFunctionData({
        abi: RaffleABI,
        functionName: 'drawWinner',
      }),
      note: 'Permissionless — anyone can call when conditions are met',
    };
  })();

  // Claim action
  const claimAction: Record<string, unknown> = (() => {
    if (statusNum !== 3) {
      return { available: false, reason: statusNum === 5 ? 'Prize already claimed' : 'No winner drawn yet' };
    }
    return {
      available: true,
      to: raffleAddress,
      function: 'claimPrize()',
      value: '0',
      calldata: encodeFunctionData({
        abi: RaffleABI,
        functionName: 'claimPrize',
      }),
      note: 'Only the winner can claim. Prize split: 2% platform fee, creator commission, remainder to winner.',
    };
  })();

  // Cancel action
  const cancelAction: Record<string, unknown> = (() => {
    if (statusNum === 2) {
      return { available: false, reason: 'Draw in progress — cannot cancel' };
    }
    if (statusNum === 3 || statusNum === 4 || statusNum === 5) {
      return { available: false, reason: 'Raffle already drawn, cancelled, or claimed' };
    }
    return {
      available: true,
      to: raffleAddress,
      function: 'cancelRaffle()',
      value: '0',
      calldata: encodeFunctionData({
        abi: RaffleABI,
        functionName: 'cancelRaffle',
      }),
      note: 'Creator can cancel anytime before draw. Anyone can cancel if deadline passed and < 2 participants.',
    };
  })();

  // Withdraw refund action
  const withdrawRefundAction: Record<string, unknown> = (() => {
    if (statusNum !== 4) {
      return { available: false, reason: 'Raffle not cancelled' };
    }
    return {
      available: true,
      to: raffleAddress,
      function: 'withdrawRefund()',
      value: '0',
      calldata: encodeFunctionData({
        abi: RaffleABI,
        functionName: 'withdrawRefund',
      }),
      note: 'Refunds entryFee * ticketCount in USDC for the caller. Only if you have tickets.',
    };
  })();

  return {
    join: joinAction,
    draw: drawAction,
    claim: claimAction,
    cancel: cancelAction,
    withdrawRefund: withdrawRefundAction,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;

    if (!isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid raffle address' },
        { status: 400, headers: corsHeaders }
      );
    }

    const raffleAddress = address as `0x${string}`;
    const { searchParams } = new URL(request.url);
    const ticketCount = Math.max(1, parseInt(searchParams.get('ticketCount') || '1', 10));

    // Multicall: getRaffleDetails + getPrizePool + prizeDescription + getParticipants + vrfRequestId + randomResult + winnerIndex
    const results = await publicClient.multicall({
      contracts: [
        { address: raffleAddress, abi: RaffleABI, functionName: 'getRaffleDetails' },
        { address: raffleAddress, abi: RaffleABI, functionName: 'getPrizePool' },
        { address: raffleAddress, abi: RaffleABI, functionName: 'prizeDescription' },
        { address: raffleAddress, abi: RaffleABI, functionName: 'getParticipants' },
        { address: raffleAddress, abi: RaffleABI, functionName: 'vrfRequestId' },
        { address: raffleAddress, abi: RaffleABI, functionName: 'randomResult' },
        { address: raffleAddress, abi: RaffleABI, functionName: 'winnerIndex' },
      ],
    });

    const [detailsResult, prizePoolResult, prizeDescResult, participantsResult, vrfResult, randomResult, winnerIndexResult] = results;

    if (detailsResult.status !== 'success') {
      return NextResponse.json(
        { error: 'Failed to read raffle — address may not be a valid Raffle contract' },
        { status: 404, headers: corsHeaders }
      );
    }

    const details = detailsResult.result as [
      string, string, bigint, bigint, bigint, bigint, number, `0x${string}`, `0x${string}`, bigint
    ];

    const [
      title, description, entryFee, deadline, maxParticipants,
      currentParticipants, status, creator, winner, creatorCommissionBps,
    ] = details;

    const statusNum = Number(status);
    const statusLabel = STATUS_LABELS[statusNum] || 'UNKNOWN';
    const deadlineNum = Number(deadline);
    const maxParticipantsNum = Number(maxParticipants);
    const currentParticipantsNum = Number(currentParticipants);

    const prizePool = prizePoolResult.status === 'success' ? prizePoolResult.result as bigint : BigInt(0);
    const prizeDesc = prizeDescResult.status === 'success' ? prizeDescResult.result as string : '';
    const participants = participantsResult.status === 'success' ? participantsResult.result as `0x${string}`[] : [];
    const vrfRequestId = vrfResult.status === 'success' ? (vrfResult.result as bigint).toString() : '0';
    const randomResultVal = randomResult.status === 'success' ? (randomResult.result as bigint).toString() : '0';
    const winnerIndexVal = winnerIndexResult.status === 'success' ? Number(winnerIndexResult.result as bigint) : 0;

    const entryFeeUsdc = parseFloat(formatUnits(entryFee, 6));
    const prizePoolUsdc = parseFloat(formatUnits(prizePool, 6));

    const actions = buildActions(
      raffleAddress,
      statusNum,
      deadlineNum,
      maxParticipantsNum,
      currentParticipantsNum,
      entryFee,
      ticketCount,
    );

    const raffle = {
      address: raffleAddress,
      title,
      description,
      prizeDescription: prizeDesc,
      entryFee: entryFee.toString(),
      entryFeeFormatted: `$${entryFeeUsdc.toFixed(2)} USDC`,
      deadline: deadlineNum,
      deadlineISO: new Date(deadlineNum * 1000).toISOString(),
      maxTickets: maxParticipantsNum,
      ticketsSold: currentParticipantsNum,
      status: statusNum,
      statusLabel,
      creator,
      winner: winner === ZERO_ADDRESS ? null : winner,
      creatorCommissionBps: Number(creatorCommissionBps),
      prizePool: prizePool.toString(),
      prizePoolFormatted: `$${prizePoolUsdc.toFixed(2)} USDC`,
      participants,
      vrfRequestId,
      randomResult: randomResultVal,
      winnerIndex: winnerIndexVal,
      actions,
    };

    return NextResponse.json(raffle, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching raffle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch raffle from chain' },
      { status: 502, headers: corsHeaders }
    );
  }
}
