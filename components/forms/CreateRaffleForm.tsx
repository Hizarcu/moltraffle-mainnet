'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';
import { StepIndicator } from './StepIndicator';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCreateRaffle } from '@/lib/contracts/hooks/useCreateRaffle';
import { useCreationFee } from '@/lib/contracts/hooks/useCreationFee';
import { useUSDCApproval } from '@/lib/contracts/hooks/useUSDCApproval';
import { createRaffleSchema, CreateRaffleFormData, defaultValues, generatePrizeDescription } from '@/lib/schemas/createRaffle';

const steps = [
  { number: 1, title: 'Basic Info', description: 'Title & Description' },
  { number: 2, title: 'Entry', description: 'Fee & Participants' },
  { number: 3, title: 'Deadline', description: 'When it ends' },
  { number: 4, title: 'Review', description: 'Confirm details' },
];

export function CreateRaffleForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<CreateRaffleFormData>({
    resolver: zodResolver(createRaffleSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { createRaffle, isCreating } = useCreateRaffle({
    onSuccess: (raffleAddress) => {
      router.push(`/room/${raffleAddress}`);
    },
  });

  const formValues = watch();

  // Flat creation fee
  const creationFee = useCreationFee();

  // USDC approval for creation fee ($1 = 1,000,000 raw)
  const { needsApproval, approve, isApproving } = useUSDCApproval({
    requiredAmount: BigInt(1000000),
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateRaffleFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'description'];
        break;
      case 2:
        fieldsToValidate = ['entryFee', 'maxParticipants', 'creatorCommission'];
        break;
      case 3:
        fieldsToValidate = ['deadline'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: CreateRaffleFormData) => {
    if (!isConnected || !chainId) {
      return;
    }

    // Auto-generate prize description based on entry fee and max participants
    const prizeDescription = generatePrizeDescription(data.entryFee, data.maxParticipants, data.creatorCommission);

    createRaffle({
      title: data.title,
      description: data.description,
      prizeDescription,
      entryFee: data.entryFee,
      deadline: data.deadline,
      maxParticipants: data.maxParticipants,
      creatorCommission: data.creatorCommission,
      chainId,
    });
  };

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-4">Please connect your wallet to create a raffle</p>
        <appkit-button />
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator steps={steps} currentStep={currentStep} />

      <Card className="p-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Raffle Title</label>
                <input
                  {...register('title')}
                  type="text"
                  placeholder="e.g., $50 USDC Raffle"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe your raffle..."
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Entry Fee & Participants */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Entry & Participants</h2>

              {/* Validation Rules Card - For AI Agents & Users */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-semibold text-blue-400 mb-2">Contract Validation Rules</p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>* <strong>Entry Fee:</strong> Must be &gt; 0 USDC and &le; $10,000 USDC</li>
                  <li>* <strong>Max Participants:</strong> 0 (unlimited) OR 2-10,000 (limited). Cannot be 1.</li>
                  <li>* <strong>Deadline:</strong> Must be in future and within 365 days</li>
                  <li className="text-yellow-400 mt-2">Values outside these limits will be rejected by smart contract</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Entry Fee (USDC)</label>
                <input
                  {...register('entryFee')}
                  type="text"
                  placeholder="1.00"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Must be greater than 0 USDC
                </p>
                {errors.entryFee && (
                  <p className="text-red-400 text-sm mt-1">{errors.entryFee.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Participants (leave empty for unlimited)
                </label>
                <input
                  {...register('maxParticipants')}
                  type="text"
                  placeholder="Leave empty for unlimited"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  0 (or empty) = unlimited, 2-10,000 = limited. Cannot use 1 participant.
                </p>
                {errors.maxParticipants && (
                  <p className="text-red-400 text-sm mt-1">{errors.maxParticipants.message}</p>
                )}
              </div>

              {/* Creator Commission */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Creator Commission: {formValues.creatorCommission || '0'}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={formValues.creatorCommission || '0'}
                  onChange={(e) => setValue('creatorCommission', e.target.value, { shouldValidate: true })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0% (no commission)</span>
                  <span>10% (max)</span>
                </div>
                {Number(formValues.creatorCommission) > 0 && formValues.entryFee && Number(formValues.entryFee) > 0 && (
                  <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-400">
                      You earn {formValues.creatorCommission}% of the prize pool
                      {formValues.maxParticipants && formValues.maxParticipants !== '' ? (
                        <span className="text-gray-400"> — up to ${((Number(formValues.entryFee) * Number(formValues.maxParticipants) * Number(formValues.creatorCommission)) / 100).toFixed(2)} USDC</span>
                      ) : null}
                    </p>
                  </div>
                )}
                {errors.creatorCommission && (
                  <p className="text-red-400 text-sm mt-1">{errors.creatorCommission.message}</p>
                )}
              </div>

              {/* Live Prize Pool Preview */}
              {formValues.entryFee && Number(formValues.entryFee) > 0 && (
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Prize Pool Preview</p>
                  {formValues.maxParticipants && formValues.maxParticipants !== '' ? (
                    <p className="font-bold text-lg text-gradient">
                      ${(Number(formValues.entryFee) * Number(formValues.maxParticipants)).toFixed(2)} USDC
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        (max {formValues.maxParticipants} x ${formValues.entryFee} USDC)
                      </span>
                    </p>
                  ) : (
                    <p className="font-bold text-lg text-gradient">
                      Dynamic
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        (Participants x ${formValues.entryFee} USDC)
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Creation Fee Preview */}
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">Creation Fee</p>
                    <p className="text-xs text-gray-500">$1.00 USDC (flat fee)</p>
                  </div>
                  <p className="font-bold text-lg">{creationFee}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Deadline */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Deadline</h2>

              <div>
                <label className="block text-sm font-medium mb-2">End Date & Time</label>
                <div className="flex gap-2 mb-3">
                  {[
                    { label: '1 Hour', ms: 60 * 60 * 1000 },
                    { label: '1 Day', ms: 24 * 60 * 60 * 1000 },
                    { label: '1 Week', ms: 7 * 24 * 60 * 60 * 1000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + preset.ms);
                        setValue('deadline', d, { shouldValidate: true });
                        const input = document.querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
                        if (input) {
                          const pad = (n: number) => String(n).padStart(2, '0');
                          input.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setValue('deadline', new Date(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Deadline must be in the future and within 365 days from now
                </p>
                {errors.deadline && (
                  <p className="text-red-400 text-sm mt-1">{errors.deadline.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Review & Confirm</h2>

              {/* Validation Status Check */}
              {(formValues.maxParticipants === '1' ||
                Number(formValues.maxParticipants) > 10000) && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-red-400 mb-2">Validation Errors Detected</p>
                  <ul className="text-xs text-red-300 space-y-1">
                    {formValues.maxParticipants === '1' && (
                      <li>* Max Participants cannot be 1 (use 0 for unlimited or 2+)</li>
                    )}
                    {Number(formValues.maxParticipants) > 10000 && (
                      <li>* Max Participants exceeds 10,000 limit</li>
                    )}
                  </ul>
                  <p className="text-xs text-yellow-400 mt-2">Transaction will fail. Please go back and fix these issues.</p>
                </div>
              )}

              <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Title</p>
                  <p className="font-medium">{formValues.title}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="font-medium">{formValues.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Entry Fee</p>
                    <p className="font-medium">${formValues.entryFee} USDC</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Max Participants</p>
                    <p className="font-medium">
                      {formValues.maxParticipants === '' ? 'Unlimited' : formValues.maxParticipants}
                    </p>
                  </div>
                </div>

                {/* Dynamic Prize Pool Display */}
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Prize Pool</p>
                  {formValues.maxParticipants && formValues.maxParticipants !== '' ? (
                    <p className="font-bold text-lg text-gradient">
                      ${(Number(formValues.entryFee || 0) * Number(formValues.maxParticipants)).toFixed(2)} USDC
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        ({formValues.maxParticipants} x ${formValues.entryFee} USDC)
                      </span>
                    </p>
                  ) : (
                    <p className="font-bold text-lg text-gradient">
                      Dynamic
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        (Participants x ${formValues.entryFee} USDC)
                      </span>
                    </p>
                  )}
                </div>

                {/* Creator Commission */}
                {Number(formValues.creatorCommission) > 0 && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-yellow-400 font-medium">Creator Commission</p>
                        <p className="text-xs text-gray-400">Deducted from prize pool when winner claims</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400">{formValues.creatorCommission}%</p>
                        {formValues.maxParticipants && formValues.maxParticipants !== '' && (
                          <p className="text-xs text-gray-400">
                            up to ${((Number(formValues.entryFee || 0) * Number(formValues.maxParticipants) * Number(formValues.creatorCommission)) / 100).toFixed(2)} USDC
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Creation Fee */}
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">Creation Fee (paid on submit)</p>
                    <p className="font-bold">{creationFee}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Deadline</p>
                  <p className="font-medium">
                    {formValues.deadline?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : needsApproval ? (
              <Button type="button" onClick={approve} disabled={isApproving}>
                {isApproving ? 'Approving...' : 'Approve USDC'}
              </Button>
            ) : (
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Raffle'}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
