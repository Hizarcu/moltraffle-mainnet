import { NextResponse } from 'next/server';

/**
 * GET /api/validation-rules
 * Returns contract validation rules in machine-readable JSON format
 * Useful for AI agents and programmatic integrations
 */
export async function GET() {
  const validationRules = {
    version: '1.0.0',
    contractVersion: 'v2.0-security-fixes',
    lastUpdated: '2026-02-09',
    rules: {
      entryFee: {
        description: 'Entry fee per ticket in ETH',
        type: 'number',
        minimum: 0,
        minimumExclusive: true,
        maximum: 100,
        unit: 'ETH',
        errors: {
          tooLow: 'EntryFeeMustBePositive: Entry fee must be greater than 0',
          tooHigh: 'EntryFeeTooHigh: Entry fee cannot exceed 100 ETH',
        },
        examples: {
          valid: [0.01, 0.1, 1, 10, 100],
          invalid: [0, -1, 101, 150],
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
        'Entry fee must be between 0 (exclusive) and 100 ETH',
        'Max participants: use 0 for unlimited, or 2-10,000 for limited',
        'Cannot create a raffle with only 1 participant',
        'Deadline must be in future and within 365 days',
      ],
      forAIAgents: [
        'Validate parameters client-side before submitting transaction to save gas',
        'All numeric values are checked on-chain and will revert with custom errors',
        'Use maxParticipants=0 for unlimited, never use maxParticipants=1',
        'Deadline is Unix timestamp in seconds',
      ],
    },
    gasOptimization: {
      creationFee: {
        formula: '1% of total payout',
        minimum: '0.0004 ETH',
        maximum: '0.05 ETH',
        calculation: 'min(max(entryFee * maxParticipants * 0.01, 0.0004), 0.05)',
        note: 'Unlimited raffles (maxParticipants=0) pay maximum fee of 0.05 ETH',
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
