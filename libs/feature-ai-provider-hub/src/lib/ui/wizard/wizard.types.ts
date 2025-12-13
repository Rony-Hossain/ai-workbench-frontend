import { ProviderType } from '@ai-workbench/bounded-contexts';

export interface WizardState {
  currentStep: number;
  providerType: ProviderType | '';
  label: string;
  endpoint: string;
  apiKey: string;
  discoveredModels: string[];
  selectedModels: string[];
  isTestingConnection: boolean;
  connectionError: string | null;
}
