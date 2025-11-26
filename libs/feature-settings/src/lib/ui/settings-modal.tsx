import React, { useState } from 'react';
import {
  Save,
  Key,
  Monitor,
  Shield,
  ChevronRight,
  Server,
  Cpu,
  User,
} from 'lucide-react';
import { Modal, Button, Input, Label } from '@ai-workbench/shared/ui';
import { cn } from '@ai-workbench/shared/utils';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { useSettingsModalStore } from '../store/settings-modal.store'; // Make sure to create/export this store file if you haven't separate it yet, or keep it inline

// --- Provider Metadata ---
const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: Cpu,
    description: 'Industry standard. Best for complex reasoning.',
    models: ['gpt-4o', 'gpt-4-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: Shield,
    description: 'Huge context window. Great for coding.',
    models: ['claude-3-5-sonnet', 'claude-3-opus'],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: Server,
    description: 'Fast and multimodal capabilities.',
    models: ['gemini-1.5-pro'],
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    icon: Monitor,
    description: 'Real-time knowledge access.',
    models: ['grok-1'],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    icon: Server,
    description: 'Private, offline, uncensored models.',
    models: ['llama3', 'mistral', 'codellama'],
  },
] as const;

export const SettingsModal: React.FC = () => {
  const { isOpen, closeSettings } = useSettingsModalStore();
  const profile = useWorkbenchStore((s) => s.profile);
  const updateProfile = useWorkbenchStore((s) => s.updateProfile);

  // UI State
  const [activeTab, setActiveTab] = useState<'general' | 'vault'>('vault');
  const [selectedProviderId, setSelectedProviderId] =
    useState<string>('openai');

  const activeProviderData = PROVIDERS.find(
    (p) => p.id === selectedProviderId
  )!;

  // Ensure profile.config exists before trying to read from it
  const safeConfig = profile.config || {};
  const currentConfig = safeConfig[
    selectedProviderId as keyof typeof safeConfig
  ] || { apiKey: '', model: '' };

  // Helper to update deep nested config config
  const updateProviderConfig = (
    providerId: string,
    key: string,
    value: string
  ) => {
    updateProfile({
      config: {
        ...profile.config,
        [providerId]: {
          ...profile.config[providerId as keyof typeof profile.config],
          [key]: value,
        },
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeSettings}
      title="System Configuration"
      className="max-w-2xl h-[600px] flex flex-col"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* --- LEFT SIDEBAR (Navigation) --- */}
        <div className="w-48 bg-neutral-900/50 border-r border-neutral-800 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors',
              activeTab === 'general'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            )}
          >
            <User className="w-4 h-4" /> General
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors',
              activeTab === 'vault'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            )}
          >
            <Key className="w-4 h-4" /> API Vault
          </button>
        </div>

        {/* --- RIGHT CONTENT AREA --- */}
        <div className="flex-1 p-6 overflow-y-auto bg-neutral-950">
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="border-b border-neutral-800 pb-2">
                <h2 className="text-sm font-bold text-white">
                  General Preferences
                </h2>
                <p className="text-xs text-neutral-500">
                  Customize your workbench identity.
                </p>
              </div>
              <div>
                <Label>Commander Name</Label>
                <Input
                  value={profile.displayName}
                  onChange={(e) =>
                    updateProfile({ displayName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Default Model Provider</Label>
                <select
                  className="w-full h-8 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-200 px-2"
                  value={profile.activeProvider}
                  onChange={(e) =>
                    updateProfile({ activeProvider: e.target.value as any })
                  }
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">
                  This provider will be used for all Agent tasks.
                </p>
              </div>
            </div>
          )}

          {/* TAB: VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="border-b border-neutral-800 pb-2">
                <h2 className="text-sm font-bold text-white">
                  Intelligence Vault
                </h2>
                <p className="text-xs text-neutral-500">
                  Manage connections to AI inference engines.
                </p>
              </div>

              {/* 1. SELECT PROVIDER */}
              <div>
                <Label>Select Provider to Configure</Label>
                <div className="relative">
                  <select
                    className="w-full h-9 bg-neutral-900 border border-neutral-800 rounded text-xs text-white px-3 appearance-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-2.5 w-4 h-4 text-neutral-500 pointer-events-none rotate-90" />
                </div>
              </div>

              {/* 2. PROVIDER DETAILS CARD */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-neutral-800 rounded-md">
                    <activeProviderData.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {activeProviderData.name}
                    </h3>
                    <p className="text-[10px] text-neutral-400">
                      {activeProviderData.description}
                    </p>
                  </div>
                </div>

                {/* 3. AUTHENTICATION FORM */}
                <div className="space-y-3 border-t border-neutral-800 pt-4">
                  {/* Base URL (Only for Ollama/Local) */}
                  {selectedProviderId === 'ollama' && (
                    <div>
                      <Label>Host URL</Label>
                      <Input
                        placeholder="http://localhost:11434"
                        value={(currentConfig as any).baseUrl || ''}
                        onChange={(e) =>
                          updateProviderConfig(
                            selectedProviderId,
                            'baseUrl',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  )}

                  {/* API Key (For Cloud Providers) */}
                  {selectedProviderId !== 'ollama' && (
                    <div>
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder={`sk-...`}
                        value={(currentConfig as any).apiKey || ''}
                        onChange={(e) =>
                          updateProviderConfig(
                            selectedProviderId,
                            'apiKey',
                            e.target.value
                          )
                        }
                        className="font-mono"
                      />
                    </div>
                  )}

                  {/* Model Selection */}
                  <div>
                    <Label>Default Model</Label>
                    <Input
                      list="model-options"
                      placeholder={activeProviderData.models[0]}
                      value={currentConfig.model}
                      onChange={(e) =>
                        updateProviderConfig(
                          selectedProviderId,
                          'model',
                          e.target.value
                        )
                      }
                    />
                    <datalist id="model-options">
                      {activeProviderData.models.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end p-4 border-t border-neutral-800 bg-neutral-900">
        <Button variant="primary" onClick={closeSettings} className="gap-2">
          <Save className="w-3 h-3" />
          Save Configuration
        </Button>
      </div>
    </Modal>
  );
};
