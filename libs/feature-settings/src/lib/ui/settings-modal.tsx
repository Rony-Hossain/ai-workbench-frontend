import React, { useState } from 'react';
import { User, Server } from 'lucide-react';
import { Modal, Input, Label } from '@ai-workbench/shared/ui';
import { cn } from '@ai-workbench/shared/utils';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { useSettingsModalStore } from '../store/settings-modal.store';
import { AIProviderHub } from '@ai-workbench/feature-ai-provider-hub';

export const SettingsModal: React.FC = () => {
  const { isOpen, closeSettings } = useSettingsModalStore();
  const profile = useWorkbenchStore((s) => s.profile);
  const updateProfile = useWorkbenchStore((s) => s.updateProfile);
  const [activeTab, setActiveTab] = useState<'general' | 'vault'>('vault');

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeSettings}
      title="System Configuration"
      className="max-w-4xl h-[700px] flex flex-col bg-neutral-950 border-neutral-800"
    >
      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 bg-neutral-900/50 border-r border-neutral-800 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors',
              activeTab === 'general' ? 'bg-primary/10 text-primary' : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            <User className="w-4 h-4" /> General
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors',
              activeTab === 'vault' ? 'bg-primary/10 text-primary' : 'text-neutral-400 hover:text-neutral-200',
            )}
          >
            <Server className="w-4 h-4" /> AI Vault
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-neutral-950">
          {activeTab === 'general' && (
            <div className="p-8 space-y-6">
              <div className="border-b border-neutral-800 pb-2">
                <h2 className="text-sm font-bold text-white">General Preferences</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Commander Name</Label>
                  <Input value={profile.displayName} onChange={(e) => updateProfile({ displayName: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={profile.email || ''} onChange={(e) => updateProfile({ email: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="h-full">
              <AIProviderHub />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
