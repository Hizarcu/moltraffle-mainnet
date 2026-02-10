'use client';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex-1 flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center relative">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  transition-all duration-300
                  ${
                    step.number === currentStep
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white scale-110'
                      : step.number < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }
                `}
              >
                {step.number < currentStep ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <div
                  className={`
                    text-sm font-medium
                    ${step.number === currentStep ? 'text-purple-400' : 'text-gray-400'}
                  `}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-1 mx-4 rounded transition-all duration-300
                  ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-700'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
