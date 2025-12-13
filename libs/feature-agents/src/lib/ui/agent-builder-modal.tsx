import React, { useEffect, useState } from 'react';
import { Bot, Save, Trash2 } from 'lucide-react';
import { Modal, Button, Input, Label } from '@ai-workbench/shared/ui';
import { trpc } from '@ai-workbench/shared/client-api';
import type { Agent } from '@ai-workbench/bounded-contexts';

interface AgentBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentToEdit: Agent | null; // Receive data from parent
}

export const AgentBuilderModal: React.FC<AgentBuilderModalProps> = ({ 
  isOpen, 
  onClose, 
  agentToEdit 
}) => {
  const utils = trpc.useContext();

  // Local Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('coder');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const { data: providers } = trpc.provider.list.useQuery();

  // Sync Form with Prop
  useEffect(() => {
    if (isOpen) {
      if (agentToEdit) {
        // Edit Mode
        setName(agentToEdit.name);
        setRole(agentToEdit.role);
        setSelectedProviderId(agentToEdit.modelId);
        setSystemPrompt(agentToEdit.systemPrompt || '');
      } else {
        // Create Mode (Reset)
        setName('');
        setRole('coder');
        setSelectedProviderId('');
        setSystemPrompt('You are a helpful AI assistant.');
      }
    }
  }, [isOpen, agentToEdit]);

  // Mutations
  const onSuccess = () => {
    utils.agent.list.invalidate(); // Refresh parent list
    onClose();
  };

  const createMutation = trpc.agent.create.useMutation({ onSuccess });
  const updateMutation = trpc.agent.update.useMutation({ onSuccess });
  const deleteMutation = trpc.agent.delete.useMutation({ onSuccess });

  const handleSubmit = () => {
    if (!selectedProviderId) return;

    if (agentToEdit) {
      updateMutation.mutate({
        id: agentToEdit.id,
        data: { name, role: role as any, modelId: selectedProviderId, systemPrompt },
      });
    } else {
      createMutation.mutate({
        name: name || 'New Agent',
        role: role as any,
        modelId: selectedProviderId,
        systemPrompt: systemPrompt || 'You are a helpful AI assistant.',
        temperature: 0.7,
        isActive: true,
        tools: [],
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agentToEdit ? `Reconfigure Unit: ${agentToEdit.name}` : 'Agent Fabrication Unit'}
    >
      <div className="p-6 space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow-neon-primary relative">
            <Bot className="w-8 h-8 text-primary" />
            {agentToEdit && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                EDIT
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Designation</Label>
              <Input
                placeholder="e.g. Atlas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-sm text-neutral-200 focus:outline-none focus:border-primary transition-colors"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="planner">Planner</option>
                <option value="coder">Coder (Lead Engineer)</option>
                <option value="reviewer">Reviewer</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Neural Backbone</Label>
            <select
              className="flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-sm text-neutral-200 focus:outline-none focus:border-primary transition-colors mt-1"
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
            >
              <option value="">Select Provider...</option>
              {providers?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label || p.name} ({p.models.length} models)
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>System Prompt</Label>
            <textarea
              className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-md p-2 text-xs text-neutral-300 focus:border-primary outline-none mt-1 resize-none"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t border-neutral-800">
          {agentToEdit ? (
            <Button
              variant="outline"
              className="text-red-400 hover:bg-red-950/30 hover:border-red-900"
              onClick={() => deleteMutation.mutate({ id: agentToEdit.id })}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Retire
            </Button>
          ) : <div />}

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSaving || !selectedProviderId}
              className="gap-2"
            >
              <Save className="w-3 h-3" />
              {isSaving ? 'Processing...' : agentToEdit ? 'Save Changes' : 'Deploy Agent'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};