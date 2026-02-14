import { NextRequest, NextResponse } from 'next/server';
import { formatEther, isAddress, encodeFunctionData } from 'viem';
import { publicClient } from '@/lib/contracts/client';
import { RaffleABI } from '@/lib/contracts/abis/Raffle';

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
  maxParticipants: number,
  currentParticipants: number,
  entryFee: bigint,
) {
  const now = Math.floor(Date.now() / 1000);
  const deadlinePassed = now >= deadlineNum;
  const isFull = maxParticipants > 0 && currentParticipants >= maxParticipants;

  // Join action
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
    return {
      available: true,
      to: raffleAddress,
      function: 'joinRaffle(uint256)',
      args: { ticketCount: 'number of tickets (uint256)' },
      value: entryFee.toString() + ' * ticketCount (in wei)',
      calldata_example: encodeFunctionData({
        abi: RaffleABI,
        functionName: 'joinRaffle',
        args: [BigInt(1)],
      }),
      note: 'Send entryFee * ticketCount as msg.value',
    };
  })();

  // Draw action
  const drawAction: Record<string, unknown> = (() => {
    if (statusNum !== 0 && statusNum !== 1) {
      return { available: false, reason: 'Draw already initiated or raffle not active' };
    }
    if (currentParticipants < 2) {
      return { available: false, reason: 'Need at least 2 participants' };
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
      note: 'Only the winner can claim',
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
      note: 'Refunds entryFee * ticketCount for the caller. Only if you have tickets.',
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

    const actions = buildActions(
      raffleAddress,
      statusNum,
      deadlineNum,
      maxParticipantsNum,
      currentParticipantsNum,
      entryFee,
    );

    const raffle = {
      address: raffleAddress,
      title,
      description,
      prizeDescription: prizeDesc,
      entryFee: entryFee.toString(),
      entryFeeFormatted: formatEther(entryFee) + ' ETH',
      deadline: deadlineNum,
      deadlineISO: new Date(deadlineNum * 1000).toISOString(),
      maxParticipants: maxParticipantsNum,
      currentParticipants: currentParticipantsNum,
      status: statusNum,
      statusLabel,
      creator,
      winner: winner === ZERO_ADDRESS ? null : winner,
      creatorCommissionBps: Number(creatorCommissionBps),
      prizePool: prizePool.toString(),
      prizePoolFormatted: formatEther(prizePool) + ' ETH',
      participants,
      vrfRequestId,
      randomResult: randomResultVal,
      winnerIndex: winnerIndexVal,
      actions,
    };

    return NextResponse.json(raffle, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
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
