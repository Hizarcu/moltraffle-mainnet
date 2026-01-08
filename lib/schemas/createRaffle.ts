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

  // Step 2: Prize Details
  prizeDescription: z
    .string()
    .min(5, 'Prize description must be at least 5 characters')
    .max(300, 'Prize description must be less than 300 characters'),

  // Step 3: Entry Fee & Participants
  entryFee: z
    .string()
    .min(1, 'Entry fee is required')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Entry fee must be greater than 0'
    ),
  maxParticipants: z
    .string()
    .refine(
      (val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0),
      'Max participants must be a number or empty for unlimited'
    ),

  // Step 4: Deadline
  deadline: z
    .date()
    .refine((date) => date > new Date(), 'Deadline must be in the future'),
});

export type CreateRaffleFormData = z.infer<typeof createRaffleSchema>;

export const defaultValues: Partial<CreateRaffleFormData> = {
  title: '',
  description: '',
  prizeDescription: '',
  entryFee: '0.01',
  maxParticipants: '',
};
