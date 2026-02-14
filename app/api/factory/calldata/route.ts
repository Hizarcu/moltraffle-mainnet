import { NextRequest, NextResponse } from 'next/server';
import { parseEther, encodeFunctionData, formatEther } from 'viem';
import { RaffleFactoryABI } from '@/lib/contracts/abis/RaffleFactory';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

const FACTORY_ADDRESS = CONTRACT_ADDRESSES[8453].RaffleFactory;
const MIN_FEE = BigInt('400000000000000');       // 0.0004 ETH
const MAX_FEE = BigInt('50000000000000000');      // 0.05 ETH
const CREATION_FEE_BPS = BigInt(100);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function calculateCreationFee(entryFeeWei: bigint, maxParticipants: bigint): bigint {
  if (maxParticipants === BigInt(0)) {
    return MAX_FEE;
  }
  let fee = entryFeeWei * maxParticipants * CREATION_FEE_BPS / BigInt(10000);
  if (fee < MIN_FEE) fee = MIN_FEE;
  if (fee > MAX_FEE) fee = MAX_FEE;
  return fee;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title');
    const description = searchParams.get('description');
    const prizeDescription = searchParams.get('prizeDescription') || '';
    const entryFeeStr = searchParams.get('entryFee');
    const deadlineStr = searchParams.get('deadline');
    const maxParticipantsStr = searchParams.get('maxParticipants');
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
      errors.push('entryFee: required (in ETH, e.g. "0.01")');
    }
    if (!deadlineStr) {
      errors.push('deadline: required (unix timestamp in seconds)');
    }
    if (maxParticipantsStr === null || maxParticipantsStr === undefined || maxParticipantsStr === '') {
      errors.push('maxParticipants: required (0 = unlimited, or 2-10000)');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters', details: errors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse and validate values
    let entryFeeWei: bigint;
    try {
      entryFeeWei = parseEther(entryFeeStr!);
    } catch {
      return NextResponse.json(
        { error: 'Invalid entryFee — must be a valid ETH amount (e.g. "0.01")' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (entryFeeWei <= BigInt(0)) {
      errors.push('entryFee must be > 0');
    }
    if (entryFeeWei > parseEther('100')) {
      errors.push('entryFee must be <= 100 ETH');
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
      errors.push('maxParticipants cannot be 1 (use 0 for unlimited or >= 2)');
    } else if (maxParticipants > 10000) {
      errors.push('maxParticipants must be <= 10000');
    }

    const creatorCommissionBps = parseInt(creatorCommissionBpsStr, 10);
    if (isNaN(creatorCommissionBps) || creatorCommissionBps < 0 || creatorCommissionBps > 1000) {
      errors.push('creatorCommissionBps must be 0-1000');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate creation fee
    const creationFee = calculateCreationFee(entryFeeWei, BigInt(maxParticipants));

    // Encode calldata
    const calldata = encodeFunctionData({
      abi: RaffleFactoryABI,
      functionName: 'createRaffle',
      args: [
        title!,
        description!,
        prizeDescription,
        entryFeeWei,
        BigInt(deadline),
        BigInt(maxParticipants),
        BigInt(creatorCommissionBps),
      ],
    });

    return NextResponse.json({
      to: FACTORY_ADDRESS,
      value: creationFee.toString(),
      valueFormatted: formatEther(creationFee) + ' ETH (creation fee)',
      calldata,
      function: 'createRaffle(string,string,string,uint256,uint256,uint256,uint256)',
      args: {
        title: title!,
        description: description!,
        prizeDescription,
        entryFee: entryFeeWei.toString(),
        entryFeeFormatted: entryFeeStr! + ' ETH',
        deadline,
        deadlineISO: new Date(deadline * 1000).toISOString(),
        maxParticipants,
        creatorCommissionBps,
      },
      estimatedGas: '~500000',
    }, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error encoding calldata:', error);
    return NextResponse.json(
      { error: 'Failed to encode calldata' },
      { status: 500, headers: corsHeaders }
    );
  }
}
