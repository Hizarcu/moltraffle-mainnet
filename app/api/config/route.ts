import { NextResponse } from 'next/server';
import { RaffleFactoryABI } from '@/lib/contracts/abis/RaffleFactory';
import { RaffleABI } from '@/lib/contracts/abis/Raffle';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const config = {
    chainId: 8453,
    chainName: 'Base',
    factoryAddress: CONTRACT_ADDRESSES[8453].RaffleFactory,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    abis: {
      RaffleFactory: RaffleFactoryABI,
      Raffle: RaffleABI,
    },
    statusEnum: {
      '0': 'UPCOMING',
      '1': 'ACTIVE',
      '2': 'ENDED',
      '3': 'DRAWN',
      '4': 'CANCELLED',
      '5': 'CLAIMED',
    },
    validationRules: {
      entryFee: {
        min: 0,
        minExclusive: true,
        max: 100,
        unit: 'ETH',
        description: 'Must be > 0 and <= 100 ETH',
      },
      maxParticipants: {
        min: 0,
        max: 10000,
        forbidden: [1],
        zeroMeansUnlimited: true,
        description: '0 = unlimited, 2-10000 = limited. Never use 1.',
      },
      deadline: {
        min: 'now + 1 second',
        max: 'now + 365 days',
        format: 'unix timestamp (seconds)',
        description: 'Must be in the future and within 365 days',
      },
      creatorCommissionBps: {
        min: 0,
        max: 1000,
        description: 'Basis points (0-1000). 1000 = 10%.',
      },
    },
    creationFee: {
      formula: 'min(max(entryFee * maxParticipants * 0.01, 0.0004 ETH), 0.05 ETH)',
      minWei: '400000000000000',
      minFormatted: '0.0004 ETH',
      maxWei: '50000000000000000',
      maxFormatted: '0.05 ETH',
      bps: 100,
      unlimitedPaysMax: true,
    },
  };

  return NextResponse.json(config, {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
