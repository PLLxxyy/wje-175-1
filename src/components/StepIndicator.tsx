import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 py-3 mb-2 overflow-x-auto">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'text-sm font-semibold whitespace-nowrap',
              index + 1 <= currentStep ? 'text-primary' : 'text-text-light'
            )}
          >
            {index + 1}. {step}
          </span>
          {index < steps.length - 1 && (
            <span className="text-text-light text-sm">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
