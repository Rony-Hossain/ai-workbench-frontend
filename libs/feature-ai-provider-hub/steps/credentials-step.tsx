import React from 'react';
import { Input, Label } from '@ai-workbench/shared/ui';
import type { WizardState } from '../wizard.types';

interface StepProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export const CredentialsStep: React.FC<StepProps> = ({ state, onChange }) => {
  return (
    <div className="space-y-5">
      <div>
        <Label>Provider</Label>
        <select
          className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-neutral-200 mt-1"
          value={state.label}
          onChange={(event) =>
            onChange({
              label: event.target.value,
              endpoint: event.target.value ? 'https://api.openai.com/v1' : '',
            })
          }
        >
          <option value="">Select Service...</option>
          <option value="OpenAI">OpenAI</option>
          <option value="Anthropic">Anthropic</option>
          <option value="Groq">Groq</option>
        </select>
      </div>

      <div>
        <Label>API Key</Label>
        <Input
          type="password"
          placeholder="sk-..."
          value={state.apiKey}
          onChange={(event) => onChange({ apiKey: event.target.value })}
          className="mt-1"
        />
        <p className="text-[10px] text-neutral-500 mt-2">
          Your key is encrypted using Electron SafeStorage and never leaves your device.
        </p>
      </div>

      <div className="p-3 bg-blue-900/20 border border-blue-900/50 rounded text-xs text-blue-200">
        ℹ️ Cloud providers require an active internet connection.
      </div>
    </div>
  );
};
