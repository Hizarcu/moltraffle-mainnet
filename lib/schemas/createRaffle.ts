import { z } from 'zod';

export const createRaffleSchema = z.object({
  // Step 1: Basic Info
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),

  // Step 2: Entry Fee & Participants
  entryFee: z
    .string()
    .min(1, 'Entry fee is required')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Entry fee must be greater than 0'
    )
    .refine(
      (val) => Number(val) <= 100,
      '⚠️ Entry fee exceeds 100 ETH limit. Transaction will fail on-chain.'
    ),
  maxParticipants: z
    .string()
    .refine(
      (val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
      'Max participants must be a number or empty for unlimited'
    )
    .refine(
      (val) => {
        if (val === '') return true; // Unlimited is OK
        const num = Number(val);
        return num !== 1;
      },
      '⚠️ Cannot create raffle with only 1 participant. Use 0 for unlimited or 2+ for limited. Transaction will fail on-chain.'
    )
    .refine(
      (val) => {
        if (val === '') return true; // Unlimited is OK
        const num = Number(val);
        return num <= 10000;
      },
      '⚠️ Max participants exceeds 10,000 limit (gas DoS protection). Transaction will fail on-chain.'
    ),

  // Creator Commission (Step 2)
  creatorCommission: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10 && Number.isInteger(Number(val)),
      'Commission must be a whole number between 0 and 10'
    ),

  // Step 3: Deadline
  deadline: z
    .date()
    .refine((date) => date > new Date(), 'Deadline must be in the future')
    .refine(
      (date) => {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1); // 365 days
        return date <= maxDate;
      },
      '⚠️ Deadline exceeds 365 days limit. Transaction will fail on-chain.'
    ),
});

export type CreateRaffleFormData = z.infer<typeof createRaffleSchema>;

export const defaultValues: Partial<CreateRaffleFormData> = {
  title: '',
  description: '',
  entryFee: '0.01',
  maxParticipants: '',
  creatorCommission: '0',
};

// Helper to calculate prize description automatically
export function generatePrizeDescription(entryFee: string, maxParticipants: string, creatorCommission?: string): string {
  const fee = Number(entryFee) || 0;
  const max = maxParticipants === '' ? 0 : Number(maxParticipants);
  const commission = Number(creatorCommission) || 0;
  const commissionNote = commission > 0 ? ` (${commission}% creator commission)` : '';

  if (max > 0) {
    const maxPrize = (fee * max).toFixed(4);
    return `Prize Pool: Up to ${maxPrize} ETH (${max} participants x ${fee} ETH)${commissionNote}`;
  }
  return `Dynamic Prize Pool: Entry Fee ${fee} ETH x Number of Participants${commissionNote}`;
}
