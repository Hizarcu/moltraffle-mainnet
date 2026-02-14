import { NextResponse } from 'next/server';

/**
 * GET /api/validation-rules
 * Returns contract validation rules in machine-readable JSON format
 * Useful for AI agents and programmatic integrations
 */
export async function GET() {
  const validationRules = {
    version: '2.0.0',
    contractVersion: 'v3.0-usdc-migration',
    lastUpdated: '2026-02-14',
    rules: {
      entryFee: {
        description: 'Entry fee per ticket in USDC (6 decimals)',
        type: 'number',
        minimum: 0.01,
        maximum: 10000,
        unit: 'USDC',
        rawMinimum: 10000,
        rawMaximum: 10000000000,
        rawUnit: 'USDC raw (6 decimals)',
        errors: {
          tooLow: 'EntryFeeTooLow: Entry fee must be at least $0.01 USDC',
          tooHigh: 'EntryFeeTooHigh: Entry fee cannot exceed $10,000 USDC',
        },
        examples: {
          valid: [0.01, 0.50, 1.00, 10, 100, 10000],
          invalid: [0, 0.001, 10001, 50000],
        },
      },
      maxParticipants: {
        description: 'Maximum number of total tickets (0 = unlimited)',
        type: 'number',
        options: [
          { value: 0, description: 'Unlimited participants' },
          { range: [2, 10000], description: 'Limited participants between 2 and 10,000' },
        ],
        forbidden: [1],
        minimum: 0,
        maximum: 10000,
        errors: {
          cannotBeOne: 'MinParticipantsTooLow: Cannot create raffle with only 1 participant',
          tooHigh: 'MaxParticipantsTooHigh: Max participants cannot exceed 10,000 (gas DoS protection)',
        },
        examples: {
          valid: [0, 2, 10, 100, 1000, 10000],
          invalid: [1, 10001, 15000],
        },
      },
      deadline: {
        description: 'Raffle end timestamp',
        type: 'timestamp',
        minimum: 'now + 1 second',
        maximum: 'now + 365 days',
        errors: {
          inPast: 'DeadlineMustBeInFuture: Deadline must be in the future',
          tooFar: 'DeadlineTooFar: Deadline cannot exceed 365 days from now',
        },
        examples: {
          valid: [
            'now + 1 hour',
            'now + 1 day',
            'now + 7 days',
            'now + 30 days',
            'now + 365 days',
          ],
          invalid: ['now - 1 hour', 'now + 366 days', 'now + 2 years'],
        },
      },
    },
    hints: {
      forHumans: [
        'Entry fee must be between $0.01 and $10,000 USDC',
        'Max participants: use 0 for unlimited, or 2-10,000 for limited',
        'Cannot create a raffle with only 1 participant',
        'Deadline must be in future and within 365 days',
        'Approve the Factory contract once, then create/join any number of raffles',
      ],
      forAIAgents: [
        'All payments are in USDC (6 decimals). Approve Factory for USDC spending first.',
        'Creation fee: flat $1 USDC. Platform fee: 2% at claim time.',
        'Join via Factory.joinRaffle(raffleAddress, ticketCount) — not directly on Raffle.',
        'Validate parameters client-side before submitting transaction to save gas.',
        'Use maxParticipants=0 for unlimited, never use maxParticipants=1.',
        'Deadline is Unix timestamp in seconds.',
      ],
    },
    feeStructure: {
      creationFee: {
        amount: '$1.00 USDC',
        raw: '1000000',
        description: 'Flat fee pulled from creator via safeTransferFrom at raffle creation',
      },
      platformFee: {
        bps: 200,
        percentage: '2%',
        description: 'Deducted from prize pool at claim time. Sent to platform owner.',
      },
      creatorCommission: {
        range: '0-10%',
        rangeBps: '0-1000',
        description: 'Set by creator. Applied to remainder after platform fee.',
      },
    },
  };

  return NextResponse.json(validationRules, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
