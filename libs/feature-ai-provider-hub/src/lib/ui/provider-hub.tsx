import React, { useState } from 'react';
import { Loader2, Plus, Server, Cloud } from 'lucide-react';
import { trpc } from '@ai-workbench/shared/client-api';
import { Button } from '@ai-workbench/shared/ui';
import { ProviderCard } from './cards/provider-card';
import { AddProviderWizard } from './wizard/add-provider-wizard';

export function AIProviderHub() {
  const [showWizard, setShowWizard] = useState(false);
  const { data: providers, isLoading, refetch } = trpc.provider.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const cloudProviders = providers?.filter((p) => p.type === 'cloud') ?? [];
  const localProviders = providers?.filter((p) => p.type !== 'cloud') ?? [];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-neutral-950 min-h-screen text-neutral-200 font-sans">
      {showWizard && (
        <AddProviderWizard
          onComplete={() => {
            setShowWizard(false);
            void refetch();
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {!showWizard && (
        <>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
            <div>
              <h1 className="text-2xl font-mono font-black text-primary uppercase tracking-wider">
                &gt; AI_PROVIDERS
              </h1>
              <p className="text-neutral-500 mt-2 text-xs font-mono uppercase tracking-widest">
                /* manage registered inference engines */
              </p>
            </div>
            <Button
              onClick={() => setShowWizard(true)}
              className="font-mono font-bold uppercase text-xs tracking-wider gap-2 shadow-neon-primary"
            >
              <Plus className="w-4 h-4" /> $ add_provider
            </Button>
          </div>

          <section className="space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Cloud className="w-4 h-4" /> [ cloud_ai ]
            </h2>
            {cloudProviders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cloudProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-neutral-800 rounded-lg bg-neutral-900/50">
                <p className="text-neutral-500 font-mono text-xs">[ no cloud providers configured ]</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-pink flex items-center gap-2">
              <Server className="w-4 h-4" /> [ local_mesh ]
            </h2>
            {localProviders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-neutral-800 rounded-lg bg-neutral-900/50">
                <p className="text-neutral-500 font-mono text-xs">[ no local nodes detected ]</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
