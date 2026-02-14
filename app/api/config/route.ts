import { NextResponse } from 'next/server';
import { RaffleFactoryABI } from '@/lib/contracts/abis/RaffleFactory';
import { RaffleABI } from '@/lib/contracts/abis/Raffle';
import { USDCABI } from '@/lib/contracts/abis/USDC';
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
    usdcAddress: CONTRACT_ADDRESSES[8453].USDC,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    unit: 'USDC',
    usdcDecimals: 6,
    platformFeeBps: 200,
    abis: {
      RaffleFactory: RaffleFactoryABI,
      Raffle: RaffleABI,
      USDC: USDCABI,
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
        min: 0.01,
        max: 10000,
        unit: 'USDC',
        description: 'Must be >= $0.01 and <= $10,000 USDC',
      },
      maxTickets: {
        min: 0,
        max: 10000,
        forbidden: [1],
        zeroMeansUnlimited: true,
        contractParam: 'maxParticipants',
        description: 'Max total tickets (not unique addresses). 0 = unlimited, 2-10000 = limited. Never use 1.',
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
        description: 'Basis points (0-1000). 1000 = 10%. Applied to remainder after 2% platform fee.',
      },
    },
    creationFee: {
      amount: '1000000',
      formatted: '$1.00 USDC',
      description: 'Flat $1 USDC creation fee (anti-spam)',
    },
    approval: {
      description: 'Users approve the Factory contract once for USDC spending. After approval, they can create and join any number of raffles without re-approving.',
      target: CONTRACT_ADDRESSES[8453].RaffleFactory,
      token: CONTRACT_ADDRESSES[8453].USDC,
      method: 'approve(address spender, uint256 amount)',
      recommendedAmount: 'type(uint256).max for unlimited approval',
    },
    feeStructure: {
      creationFee: '$1.00 USDC (flat, paid at creation)',
      platformFee: '2% of prize pool (deducted at claim time)',
      creatorCommission: '0-10% of remainder after platform fee (set by creator)',
    },
  };

  return NextResponse.json(config, {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
