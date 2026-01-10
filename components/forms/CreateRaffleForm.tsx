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

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateRaffleFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'description'];
        break;
      case 2:
        fieldsToValidate = ['entryFee', 'maxParticipants'];
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
    const prizeDescription = generatePrizeDescription(data.entryFee, data.maxParticipants);

    createRaffle({
      title: data.title,
      description: data.description,
      prizeDescription,
      entryFee: data.entryFee,
      deadline: data.deadline,
      maxParticipants: data.maxParticipants,
      chainId,
    });
  };

  if (!isConnected) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-400">Please connect your wallet to create a raffle</p>
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
                  placeholder="e.g., Win a Premium NFT Collection"
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

              <div>
                <label className="block text-sm font-medium mb-2">Entry Fee (ETH)</label>
                <input
                  {...register('entryFee')}
                  type="text"
                  placeholder="0.01"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
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
                {errors.maxParticipants && (
                  <p className="text-red-400 text-sm mt-1">{errors.maxParticipants.message}</p>
                )}
              </div>

              {/* Live Prize Pool Preview */}
              {formValues.entryFee && Number(formValues.entryFee) > 0 && (
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Prize Pool Preview</p>
                  {formValues.maxParticipants && formValues.maxParticipants !== '' ? (
                    <p className="font-bold text-lg text-gradient">
                      {(Number(formValues.entryFee) * Number(formValues.maxParticipants)).toFixed(4)} ETH
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        (max {formValues.maxParticipants} x {formValues.entryFee} ETH)
                      </span>
                    </p>
                  ) : (
                    <p className="font-bold text-lg text-gradient">
                      Dynamic
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        (Participants x {formValues.entryFee} ETH)
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Deadline */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Deadline</h2>

              <div>
                <label className="block text-sm font-medium mb-2">End Date & Time</label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setValue('deadline', new Date(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
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
                    <p className="font-medium">{formValues.entryFee} ETH</p>
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
                      {(Number(formValues.entryFee || 0) * Number(formValues.maxParticipants)).toFixed(4)} ETH
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        ({formValues.maxParticipants} x {formValues.entryFee} ETH)
                      </span>
                    </p>
                  ) : (
                    <p className="font-bold text-lg text-gradient">
                      Dynamic
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        (Participants x {formValues.entryFee} ETH)
                      </span>
                    </p>
                  )}
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
