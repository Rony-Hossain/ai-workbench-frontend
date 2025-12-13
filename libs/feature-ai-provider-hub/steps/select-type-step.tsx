import React from 'react';
import { Server, Cloud, Container } from 'lucide-react';
import { cn } from '@ai-workbench/shared/utils';
import type { WizardState } from '../wizard.types';

interface StepProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export const SelectTypeStep: React.FC<StepProps> = ({ state, onChange }) => {
  const options = [
    {
      id: 'local',
      icon: Server,
      title: 'Local AI Mesh',
      desc: 'Connect to Ollama, LM Studio, or your local 10.0.x cluster.',
    },
    {
      id: 'cloud',
      icon: Cloud,
      title: 'Cloud Provider',
      desc: 'Connect to OpenAI, Anthropic, or Google via API Key.',
    },
    {
      id: 'docker',
      icon: Container,
      title: 'Docker Container',
      desc: 'Auto-discover containers running AI inference services.',
    },
  ] as const;

  return (
    <div className="space-y-4">
      <p className="text-neutral-400 text-sm">
        Select the type of intelligence node to connect:
      </p>
      <div className="grid gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange({ providerType: opt.id as WizardState['providerType'] })}
            className={cn(
              'flex items-center gap-4 p-4 rounded-lg border text-left transition-all',
              state.providerType === opt.id
                ? 'bg-primary/10 border-primary shadow-neon-primary'
                : 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600',
            )}
          >
            <div
              className={cn(
                'p-3 rounded-md',
                state.providerType === opt.id ? 'bg-primary/20 text-primary' : 'bg-neutral-700 text-neutral-400',
              )}
            >
              <opt.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className={cn('font-bold', state.providerType === opt.id ? 'text-primary' : 'text-white')}>
                {opt.title}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
