import { NextRequest, NextResponse } from 'next/server';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';
import { RaffleFactoryABI } from '@/lib/contracts/abis/RaffleFactory';
import { USDCABI } from '@/lib/contracts/abis/USDC';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { corsHeaders } from '@/lib/cors';

const FACTORY_ADDRESS = CONTRACT_ADDRESSES[8453].RaffleFactory;
const USDC_ADDRESS = CONTRACT_ADDRESSES[8453].USDC;
const CREATION_FEE = BigInt(1000000); // $1 USDC

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: NextRequest) {
  const cors = corsHeaders(request);
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title');
    const description = searchParams.get('description');
    const prizeDescription = searchParams.get('prizeDescription') || '';
    const entryFeeStr = searchParams.get('entryFee');
    const deadlineStr = searchParams.get('deadline');
    const maxParticipantsStr = searchParams.get('maxTickets') || searchParams.get('maxParticipants');
    const creatorCommissionBpsStr = searchParams.get('creatorCommissionBps') || '0';

    // Validate required params
    const errors: string[] = [];

    if (!title || title.length < 3 || title.length > 100) {
      errors.push('title: required, 3-100 characters');
    }
    if (!description || description.length < 10 || description.length > 500) {
      errors.push('description: required, 10-500 characters');
    }
    if (!entryFeeStr) {
      errors.push('entryFee: required (in USDC, e.g. "1.00")');
    }
    if (!deadlineStr) {
      errors.push('deadline: required (unix timestamp in seconds)');
    }
    if (maxParticipantsStr === null || maxParticipantsStr === undefined || maxParticipantsStr === '') {
      errors.push('maxTickets: required (0 = unlimited, or 2-10000). Alias: maxParticipants');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters', details: errors },
        { status: 400, headers: cors }
      );
    }

    // Parse and validate values (USDC has 6 decimals)
    let entryFeeRaw: bigint;
    try {
      entryFeeRaw = parseUnits(entryFeeStr!, 6);
    } catch {
      return NextResponse.json(
        { error: 'Invalid entryFee — must be a valid USDC amount (e.g. "1.00")' },
        { status: 400, headers: cors }
      );
    }

    if (entryFeeRaw < BigInt(10000)) {
      errors.push('entryFee must be >= $0.01 USDC');
    }
    if (entryFeeRaw > BigInt(10000000000)) {
      errors.push('entryFee must be <= $10,000 USDC');
    }

    const deadline = parseInt(deadlineStr!, 10);
    if (isNaN(deadline) || deadline <= 0) {
      errors.push('deadline must be a valid unix timestamp');
    } else {
      const now = Math.floor(Date.now() / 1000);
      if (deadline <= now) {
        errors.push('deadline must be in the future');
      }
      if (deadline > now + 365 * 24 * 60 * 60) {
        errors.push('deadline must be within 365 days');
      }
    }

    const maxParticipants = parseInt(maxParticipantsStr!, 10);
    if (isNaN(maxParticipants) || maxParticipants < 0) {
      errors.push('maxParticipants must be >= 0');
    } else if (maxParticipants === 1) {
      errors.push('maxTickets cannot be 1 (use 0 for unlimited or >= 2)');
    } else if (maxParticipants > 10000) {
      errors.push('maxTickets must be <= 10000');
    }

    const creatorCommissionBps = parseInt(creatorCommissionBpsStr, 10);
    if (isNaN(creatorCommissionBps) || creatorCommissionBps < 0 || creatorCommissionBps > 1000) {
      errors.push('creatorCommissionBps must be 0-1000');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400, headers: cors }
      );
    }

    // Auto-generate prizeDescription if not provided
    let finalPrizeDescription = prizeDescription;
    if (!finalPrizeDescription) {
      const feeUsdc = parseFloat(formatUnits(entryFeeRaw, 6));
      const commNote = creatorCommissionBps > 0 ? ` (${(creatorCommissionBps / 100).toFixed(0)}% creator commission)` : '';
      if (maxParticipants > 0) {
        const maxPrize = (feeUsdc * maxParticipants).toFixed(2);
        finalPrizeDescription = `Prize Pool: Up to $${maxPrize} USDC (${maxParticipants} participants x $${feeUsdc.toFixed(2)} USDC)${commNote}`;
      } else {
        finalPrizeDescription = `Dynamic Prize Pool: Entry Fee $${feeUsdc.toFixed(2)} USDC x Number of Participants${commNote}`;
      }
    }

    // Encode createRaffle calldata
    const calldata = encodeFunctionData({
      abi: RaffleFactoryABI,
      functionName: 'createRaffle',
      args: [
        title!,
        description!,
        finalPrizeDescription,
        entryFeeRaw,
        BigInt(deadline),
        BigInt(maxParticipants),
        BigInt(creatorCommissionBps),
      ],
    });

    // Encode USDC approval calldata (for agents that need it)
    const usdcApprovalCalldata = encodeFunctionData({
      abi: USDCABI,
      functionName: 'approve',
      args: [
        FACTORY_ADDRESS as `0x${string}`,
        BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'), // max uint256
      ],
    });

    return NextResponse.json({
      to: FACTORY_ADDRESS,
      value: '0',
      calldata,
      function: 'createRaffle(string,string,string,uint256,uint256,uint256,uint256)',
      args: {
        title: title!,
        description: description!,
        prizeDescription: finalPrizeDescription,
        entryFee: entryFeeRaw.toString(),
        entryFeeFormatted: '$' + entryFeeStr! + ' USDC',
        deadline,
        deadlineISO: new Date(deadline * 1000).toISOString(),
        maxTickets: maxParticipants,
        creatorCommissionBps,
      },
      creationFee: {
        amount: CREATION_FEE.toString(),
        formatted: '$1.00 USDC',
        note: 'Factory pulls $1 USDC via safeTransferFrom. Caller must have approved Factory for USDC spending.',
      },
      usdcApproval: {
        to: USDC_ADDRESS,
        calldata: usdcApprovalCalldata,
        function: 'approve(address,uint256)',
        note: 'Call this first if the Factory does not have sufficient USDC allowance. One-time approval for unlimited spending.',
      },
      estimatedGas: '~500000',
    }, {
      headers: {
        ...cors,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error encoding calldata:', error);
    return NextResponse.json(
      { error: 'Failed to encode calldata' },
      { status: 500, headers: cors }
    );
  }
}
