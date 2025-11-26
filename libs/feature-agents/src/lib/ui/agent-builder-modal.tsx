import React, { useState } from 'react';
import { Bot, Cpu, Save } from 'lucide-react';
import { Modal, Button, Input, Label } from '@ai-workbench/shared/ui';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';
import { useAgentBuilderStore } from '../store/agent-builder.store';
import type { Agent } from '@ai-workbench/bounded-contexts';

export const AgentBuilderModal: React.FC = () => {
  const { isOpen, closeBuilder } = useAgentBuilderStore();
  const addAgent = useWorkbenchStore(s => s.addAgent); // Action from Phase 2

  const [name, setName] = useState('');
  const [role, setRole] = useState('lead_engineer');
  const [model, setModel] = useState('gpt-4o');

  const handleSubmit = () => {
    const newId = `agent-${Date.now()}`;
    
    const newAgent: Agent = {
      id: newId,
      name: name || 'New Agent',
      model: model,
      kind: role as any,
      systemPrompt: 'You are a helpful AI assistant.'
    };

    // 1. Add to Global State
    addAgent(newAgent);
    
    // 2. Reset Form
    setName('');
    closeBuilder();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={closeBuilder} 
      title="Agent Fabrication Unit"
    >
      <div className="p-6 space-y-6">
        {/* Avatar Preview */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shadow-neon-primary">
            <Bot className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Identity */}
          <div>
            <Label>Designation (Name)</Label>
            <Input 
              placeholder="e.g. Atlas" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Role</Label>
              <select 
                className="flex h-8 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="planner">Planner</option>
                <option value="lead_engineer">Lead Engineer</option>
                <option value="reviewer">Reviewer</option>
              </select>
            </div>
            <div>
              <Label>Model Engine</Label>
              <select 
                className="flex h-8 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="gpt-4o">GPT-4o (OpenAI)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 (Anthropic)</option>
                <option value="llama-3-70b">Llama 3 (Local)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
          <Button variant="ghost" onClick={closeBuilder}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} className="gap-2">
            <Save className="w-3 h-3" />
            Deploy Agent
          </Button>
        </div>
      </div>
    </Modal>
  );
};