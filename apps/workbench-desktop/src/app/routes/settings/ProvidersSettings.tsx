import React, { useState } from 'react';
import { ConnectMeshForm } from '../../components/providers/ConnectMeshForm';
import { trpc } from '../../utils/trpc'; 
import { Server, Trash2, Zap, Brain, Eye } from 'lucide-react';

const ROLE_MAP: Record<string, string> = {
  '8081': 'planner-agent',
  '8082': 'executor-agent',
  '8080': 'reviewer-agent',
  '8092': 'rag-embeddings',
};

export const ProvidersSettings = () => {
  const [isScanning, setIsScanning] = useState(false);
  
  // 1. Fetch from DB
  const { data: providers, refetch } = trpc.provider.list.useQuery();
  
  // 2. Mutations
  const importMutation = trpc.provider.importSwarm.useMutation({
    onSuccess: () => {
        refetch();
        setIsScanning(false);
    },
  });
  
  const deleteMutation = trpc.provider.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleMeshImport = async (scanResults: any[]) => {
    // Transform Scan Result -> Router Input Format
    const newProviders = scanResults.map((svc) => {
      const port = svc.id.split('-')[1]; 
      const suggestedRole = ROLE_MAP[port] || 'generic-llm';

      // FIX: Handle 'models' array from scanner vs 'modelId' expected by router
      // If scanner gave us a list, pick the first one as the default model
      const detectedModel = svc.models && svc.models.length > 0 
        ? svc.models[0] 
        : (svc.modelId || 'unknown-model');

      return {
        id: svc.id,
        name: svc.name,
        endpoint: svc.endpoint || svc.baseUrl, // Handle both naming conventions
        model: detectedModel, 
        role: suggestedRole,
        type: 'local-swarm',
      };
    });

    // Execute Batch Import
    await importMutation.mutateAsync(newProviders);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Intelligence Nodes</h1>
          <p className="text-xs text-neutral-500">Manage connections to Local Swarms and Cloud APIs</p>
        </div>
        {!isScanning && (
          <button
            onClick={() => setIsScanning(true)}
            className="bg-primary text-black px-4 py-2 text-xs font-bold rounded hover:bg-primary/90 transition-colors"
          >
            + Add Connection
          </button>
        )}
      </div>

      {isScanning ? (
        <ConnectMeshForm
          onComplete={handleMeshImport}
          onCancel={() => setIsScanning(false)}
        />
      ) : (
        <div className="space-y-3">
          {providers?.length === 0 && (
            <div className="text-center py-12 border border-dashed border-neutral-800 rounded bg-neutral-900/30">
              <Server className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
              <p className="text-sm text-neutral-500">No active intelligence nodes.</p>
              <p className="text-xs text-neutral-600">Connect your Swarm (10.0.0.110) to get started.</p>
            </div>
          )}

          {providers?.map((p: any) => (
            <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded p-4 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center">
                   {/* Visual Badge for Role based on Label or inferred role */}
                   {p.label?.includes('executor') ? <Zap className="w-5 h-5 text-yellow-400" /> :
                    p.label?.includes('planner') ? <Brain className="w-5 h-5 text-purple-400" /> :
                    p.label?.includes('reviewer') ? <Eye className="w-5 h-5 text-blue-400" /> :
                    <Server className="w-5 h-5 text-neutral-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{p.label}</h3>
                    {p.status === 'running' && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online"/>}
                  </div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">
                    {p.endpoint}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => deleteMutation.mutate({ id: p.id })}
                    className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};