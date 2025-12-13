import React, { useState } from 'react';
import { trpc } from '@ai-workbench/shared/client-api';
import { Card, Button } from '@ai-workbench/shared/ui';
import { Check, ChevronRight, X } from 'lucide-react';
import { SelectTypeStep } from './steps/select-type-step';
import { LocalDiscoveryStep } from './steps/local-discovery-step';
import { CredentialsStep } from './steps/credentials-step';
import type { WizardState } from './wizard.types';

interface WizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function AddProviderWizard({ onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    providerType: '',
    label: '',
    endpoint: '',
    apiKey: '',
    discoveredModels: [],
    selectedModels: [],
    isTestingConnection: false,
    connectionError: null,
  });

  const createMutation = trpc.provider.create.useMutation({
    onSuccess: onComplete,
  });

  const updateState = (updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step === 0 && state.providerType) {
      setStep(1);
      updateState({ currentStep: 1 });
      return;
    }

    if (step === 1) {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (!state.providerType) return;
    const modelsPayload = state.selectedModels.length > 0 
      ? state.selectedModels.map(m => ({ 
          id: m, 
          name: m, 
          capabilities: ['chat'],
          status: 'available' 
        }))
      : [];

    createMutation.mutate({
      type: state.providerType as any,
      name: state.label || 'Unnamed Provider',
      label: state.label || 'Unnamed Provider',
      endpoint: state.endpoint,
      apiKey: state.apiKey || undefined,
      workspaceScope: 'global',
      models: modelsPayload as any, 
    });
  };

  const renderStep = () => {
    if (step === 0) {
      return <SelectTypeStep state={state} onChange={updateState} />;
    }

    if (state.providerType === 'cloud') {
      return <CredentialsStep state={state} onChange={updateState} />;
    }

    return <LocalDiscoveryStep state={state} onChange={updateState} />;
  };

  const canProceed = () => {
    if (step === 0) {
      return !!state.providerType;
    }
    if (state.providerType === 'cloud') {
      return Boolean(state.label && state.apiKey);
    }
    return Boolean(state.label && state.endpoint);
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <Card className="w-full max-w-2xl bg-neutral-900 border-primary/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-pink">
                ◆ Initialize Neural Link
              </h2>
              <p className="text-xs font-mono text-neutral-500 mt-1">
                STEP {step + 1} / 2: {step === 0 ? 'SELECT TYPE' : 'CONFIGURATION'}
              </p>
            </div>
            <button onClick={onCancel} className="text-neutral-500 hover:text-white" type="button">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <div className={`h-1 flex-1 rounded-full ${step >= 0 ? 'bg-primary' : 'bg-neutral-800'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-neutral-800'}`} />
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">{renderStep()}</div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
          {step > 0 && (
            <Button variant='ghost' onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || createMutation.isPending}
            className="w-32 shadow-neon-primary"
          >
            {createMutation.isPending ? (
              'Linking...'
            ) : step === 1 ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Connect
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
