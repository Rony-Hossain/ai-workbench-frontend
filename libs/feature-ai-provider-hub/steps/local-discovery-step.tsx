import React from 'react';
import { trpc } from '@ai-workbench/shared/client-api';
import { Button, Input, Label } from '@ai-workbench/shared/ui';
import { Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import type { WizardState } from '../wizard.types';

interface StepProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export const LocalDiscoveryStep: React.FC<StepProps> = ({ state, onChange }) => {
  const { data: nodes, isLoading, refetch } = trpc.provider.scanLocalNetwork.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const handleSelectNode = (node: any) => {
    onChange({
      label: node.name,
      endpoint: node.endpoint,
      discoveredModels: node.models,
      selectedModels: node.models,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label>Network Scan Results</Label>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-3 h-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Rescan
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-lg">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-xs text-neutral-500">Scanning 10.0.0.x and localhost...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {nodes?.length === 0 && (
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded text-center text-xs text-neutral-500">
              No active AI services found. Ensure your mesh is running on ports 8080-8090.
            </div>
          )}

          {nodes?.map((node) => (
            <div
              key={node.endpoint}
              onClick={() => handleSelectNode(node)}
              className={`p-3 border rounded cursor-pointer transition-all flex items-center justify-between ${
                state.endpoint === node.endpoint
                  ? 'bg-primary/10 border-primary'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600'
              }`}
            >
              <div>
                <div className="font-bold text-neutral-200">{node.name}</div>
                <div className="text-[10px] font-mono text-neutral-500">{node.endpoint}</div>
              </div>
              {state.endpoint === node.endpoint && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-neutral-800 space-y-3">
        <Label className="block">Or Enter Manually</Label>
        <Input
          placeholder="Display Name (e.g. My GPU)"
          value={state.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
        <Input
          placeholder="Endpoint (e.g. http://192.168.1.50:11434)"
          value={state.endpoint}
          onChange={(event) => onChange({ endpoint: event.target.value })}
        />
      </div>
    </div>
  );
};
