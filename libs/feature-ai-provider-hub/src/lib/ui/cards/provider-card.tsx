import React from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@ai-workbench/shared/ui';
import type { Provider } from '@ai-workbench/bounded-contexts';
import { cn } from '@ai-workbench/shared/utils';
import { trpc } from '@ai-workbench/shared/client-api';

const statusConfig: Record<
  Provider['status'],
  { label: string; color: string; icon: string }
> = {
  running: { label: 'Running', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', icon: '●' },
  offline: { label: 'Offline', color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: '●' },
  error: { label: 'Error', color: 'bg-red-500/20 text-red-400 border-red-500/50', icon: '!' },
  auth_error: { label: 'Auth Expired', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50', icon: '●' },
};

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const status = statusConfig[provider.status] ?? statusConfig.offline;
  const refreshMutation = trpc.provider.refreshModels.useMutation();

  return (
    <Card
      className="overflow-hidden border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 group relative"
      style={{ boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.05)' }}
    >
      <CardHeader className="pb-3 relative z-10 border-b border-neutral-800/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-sm font-mono font-bold text-primary uppercase tracking-wider">
              [{provider.name}]
            </CardTitle>
            <p className="text-xs text-neutral-400 mt-2 font-mono">
              {provider.label ?? provider.name}
            </p>
          </div>
          <Badge className={cn('font-mono text-[10px] font-bold uppercase tracking-wide', status.color)}>
            <span className="mr-1">{status.icon}</span> {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10 pt-4">
        <div className="space-y-1 pl-3 border-l-2 border-primary/20">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Models:</p>
          <p className="font-mono font-bold text-lg text-neutral-200">{provider.models.length}</p>
        </div>

        {provider.endpoint && (
          <div className="space-y-1 border-l-2 border-neutral-800 pl-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Endpoint:</p>
            <p className="font-mono text-[10px] break-all text-primary/80">
              <span className="text-neutral-600">$</span> {provider.endpoint}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-primary/5 border-neutral-800 hover:bg-neutral-800 hover:text-white font-mono text-[10px] uppercase"
            onClick={() => refreshMutation.mutate({ providerId: provider.id })}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? 'Syncing...' : '$ refresh_models'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
