import React, { useState } from 'react';
import { CheckCircle2, Loader2, Network } from 'lucide-react';

const KNOWN_PORTS = [
  { port: 8080, label: 'Intern (Phi-3)', type: 'chat' },
  { port: 8081, label: 'Architect (DeepSeek)', type: 'chat' },
  { port: 8082, label: 'Engineer (Qwen)', type: 'chat' },
  { port: 8092, label: 'Embeddings (Jina)', type: 'embedding' },
];

export interface MeshServiceResult {
  id: string;
  name: string;
  baseUrl: string;
  modelId: string;
  type: string;
  status: 'active';
}

interface ConnectMeshFormProps {
  onComplete: (services: MeshServiceResult[]) => void;
  onCancel: () => void;
}

export const ConnectMeshForm: React.FC<ConnectMeshFormProps> = ({
  onComplete,
  onCancel,
}) => {
  const [nodeIp, setNodeIp] = useState('10.0.0.110');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete'>(
    'idle',
  );
  const [results, setResults] = useState<MeshServiceResult[]>([]);

  const scanNode = async () => {
    setStatus('scanning');
    setResults([]);
    const foundServices: MeshServiceResult[] = [];

    await Promise.all(
      KNOWN_PORTS.map(async (config) => {
        const baseUrl = `http://${nodeIp}:${config.port}/v1`;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const res = await fetch(`${baseUrl}/models`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) return;

          const data = await res.json();
          const modelId = data?.data?.[0]?.id ?? 'unknown-model';

          foundServices.push({
            id: `swarm-${config.port}`,
            name: config.label,
            baseUrl,
            modelId,
            type: config.type,
            status: 'active',
          });
        } catch (error) {
          console.warn(`Port ${config.port} unreachable on ${nodeIp}`);
        }
      }),
    );

    setResults(foundServices);
    setStatus('complete');
  };

  const handleSave = () => {
    onComplete(results);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-lg space-y-4">
        <div>
          <label className="text-xs uppercase font-bold text-neutral-500">
            Swarm IP Address
          </label>
          <div className="relative mt-1">
            <Network className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={nodeIp}
              onChange={(event) => setNodeIp(event.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 pl-9 text-sm font-mono text-neutral-200 focus:border-primary/50 outline-none"
            />
          </div>
        </div>

        {status !== 'idle' && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-neutral-500 uppercase flex justify-between">
              <span>Discovery Results</span>
              {status === 'scanning' && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
            </div>

            <div className="bg-black/40 rounded border border-neutral-800 divide-y divide-neutral-800">
              {results.length === 0 && status === 'complete' && (
                <div className="p-3 text-xs text-red-400 text-center">
                  No active agents found on {nodeIp}.<br />
                  Check CORS and Docker containers.
                </div>
              )}

              {results.map((service) => (
                <div
                  key={service.id}
                  className="p-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-neutral-200">
                        {service.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {service.baseUrl}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
                    {service.modelId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 rounded transition-colors"
        >
          Cancel
        </button>

        {status !== 'complete' ? (
          <button
            type="button"
            onClick={scanNode}
            disabled={status === 'scanning'}
            className="flex-1 py-2 bg-primary hover:bg-primary/90 text-black text-xs font-bold rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {status === 'scanning' ? 'Scanning...' : 'Scan Node'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={results.length === 0}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            Import {results.length} Agents
          </button>
        )}
      </div>
    </div>
  );
};
