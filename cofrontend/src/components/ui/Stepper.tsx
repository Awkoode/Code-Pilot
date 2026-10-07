import type { ReactNode } from 'react';

interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
}: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <div
              key={step.id}
              className={`flex gap-4 ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => isClickable && onStepClick(index)}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                    ${isCompleted
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : isCurrent
                        ? 'border-primary bg-primary/10 text-primary animate-pulse-glow'
                        : 'border-border text-slate-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon || <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-full w-0.5 transition-colors duration-300 ${
                      isCompleted ? 'bg-green-400' : 'bg-border'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-8">
                <h4 className={`font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-500'}`}>
                  {step.title}
                </h4>
                {step.description && (
                  <p className="mt-1 text-sm text-slate-400">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isClickable = onStepClick && index <= currentStep;

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div
              className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => isClickable && onStepClick(index)}
            >
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                  ${isCompleted
                    ? 'border-green-400 bg-green-400/10 text-green-400'
                    : isCurrent
                      ? 'border-primary bg-primary/10 text-primary animate-pulse-glow'
                      : 'border-border text-slate-500'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon || <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-500'}`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-2 h-0.5 flex-1">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? 'bg-green-400' : 'bg-border'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
