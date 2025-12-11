import React, { useMemo, useState } from 'react';
import { Loader2, Server, CheckCircle2, AlertCircle, Cloud } from 'lucide-react';
import { trpc } from '@ai-workbench/shared/client-api';
import { Button, Card, Input, Label } from '@ai-workbench/shared/ui';
import type { CreateProviderDto } from '@ai-workbench/bounded-contexts';

interface WizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

type WizardStep = 'type' | 'scan' | 'config';
type ProviderFlavor = 'local' | 'cloud';

interface ScanResult {
  endpoint: string;
  name: string;
  models: string[];
}

export function AddProviderWizard({ onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState<WizardStep>('type');
  const [type, setType] = useState<ProviderFlavor>('local');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Pick<CreateProviderDto, 'name' | 'label' | 'endpoint' | 'apiKey'>>({
    name: '',
    label: '',
    endpoint: '',
    apiKey: '',
  });

  const createMutation = trpc.provider.create.useMutation();
  const scanQuery = trpc.provider.scanLocalNetwork.useQuery(undefined, {
    enabled: step === 'scan',
    refetchOnWindowFocus: false,
  });

  const handleCreate = async (input: { name: string; label?: string; endpoint?: string; apiKey?: string }) => {
    try {
      setError(null);
      await createMutation.mutateAsync({
        name: input.name,
        label: input.label ?? input.name,
        type,
        endpoint: input.endpoint,
        apiKey: input.apiKey || undefined,
        workspaceScope: 'global',
      });
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create provider';
      setError(message);
    }
  };

  const isFormValid = useMemo(() => {
    if (!formData.name.trim()) return false;
    if (type === 'local' && !formData.endpoint?.trim()) return false;
    return true;
  }, [formData, type]);

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-neutral-900 border-primary/30 shadow-neon-primary">
        <div className="p-8 space-y-6">
          <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-wider text-primary">◆ Add Intelligence Node</h2>
            <Button variant="ghost" onClick={onCancel} className="text-xs uppercase font-mono">
              Cancel
            </Button>
          </div>

          {step === 'type' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setType('local');
                  setStep('scan');
                }}
                className="p-6 border border-neutral-700 hover:border-primary bg-neutral-800/50 hover:bg-neutral-800 transition-all rounded-lg text-left group"
              >
                <Server className="w-8 h-8 text-neutral-400 group-hover:text-primary mb-4" />
                <h3 className="font-bold text-white">Local Mesh</h3>
                <p className="text-xs text-neutral-500 mt-2">Connect to Ollama, LM Studio, or your 10.0.x cluster.</p>
              </button>
              <button
                onClick={() => {
                  setType('cloud');
                  setStep('config');
                }}
                className="p-6 border border-neutral-700 hover:border-primary bg-neutral-800/50 hover:bg-neutral-800 transition-all rounded-lg text-left group"
              >
                <Cloud className="w-8 h-8 text-neutral-400 group-hover:text-primary mb-4" />
                <h3 className="font-bold text-white">Cloud Provider</h3>
                <p className="text-xs text-neutral-500 mt-2">Connect to OpenAI, Anthropic, or Google.</p>
              </button>
            </div>
          )}

          {step === 'scan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">Scanning local network for AI services...</p>
                {scanQuery.isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scanQuery.data?.map((node: ScanResult) => (
                  <button
                    key={node.endpoint}
                    onClick={() =>
                      handleCreate({
                        name: node.name,
                        label: node.name,
                        endpoint: node.endpoint,
                      })
                    }
                    className="w-full p-4 border border-neutral-800 hover:border-primary/50 bg-neutral-900 cursor-pointer rounded flex items-center justify-between group text-left"
                  >
                    <div>
                      <div className="font-bold text-white group-hover:text-primary">{node.name}</div>
                      <div className="text-xs font-mono text-neutral-500">{node.endpoint}</div>
                    </div>
                    <div className="text-xs text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Online
                    </div>
                  </button>
                ))}

                {!scanQuery.isLoading && (scanQuery.data?.length ?? 0) === 0 && (
                  <div className="p-4 text-center text-neutral-500 border border-dashed border-neutral-800 rounded">
                    No local AI services found. Ensure they are running.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep('type')} className="text-xs font-mono uppercase">
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('config')} className="text-xs font-mono uppercase">
                    Manual Setup
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'config' && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreate({
                  name: formData.name,
                  label: formData.label,
                  endpoint: formData.endpoint,
                  apiKey: formData.apiKey,
                });
              }}
            >
              <div className="grid gap-4">
                <div>
                  <Label className="text-xs font-mono uppercase text-neutral-400">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: event.target.value,
                        label: prev.label || event.target.value,
                      }))
                    }
                    placeholder="deepseek-coder"
                    className="bg-neutral-950 border-neutral-800 mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono uppercase text-neutral-400">Label</Label>
                  <Input
                    value={formData.label}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        label: event.target.value,
                      }))
                    }
                    placeholder="DeepSeek Coder"
                    className="bg-neutral-950 border-neutral-800 mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono uppercase text-neutral-400">Endpoint</Label>
                  <Input
                    value={formData.endpoint}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        endpoint: event.target.value,
                      }))
                    }
                    placeholder="http://localhost:11434/v1"
                    className="bg-neutral-950 border-neutral-800 mt-1 font-mono text-xs"
                  />
                </div>
                {type === 'cloud' && (
                  <div>
                    <Label className="text-xs font-mono uppercase text-neutral-400">API Key</Label>
                    <Input
                      value={formData.apiKey}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          apiKey: event.target.value,
                        }))
                      }
                      placeholder="sk-..."
                      className="bg-neutral-950 border-neutral-800 mt-1 font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                <Button variant="ghost" onClick={() => setStep('type')} className="text-xs font-mono uppercase">
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!isFormValid || createMutation.isPending}
                    className="text-xs font-mono uppercase"
                  >
                    {createMutation.isPending ? 'Saving...' : 'Save Provider'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
