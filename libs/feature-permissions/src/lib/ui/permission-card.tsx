import React from 'react';
import { AlertTriangle, Check, X, ShieldAlert, ChevronRight } from 'lucide-react';
import { Button, Card } from '@ai-workbench/shared/ui';
import { cn } from '@ai-workbench/shared/utils';
import type { PermissionRequest } from '@ai-workbench/bounded-contexts';

interface PermissionCardProps {
  request: PermissionRequest;
  onApprove: () => void;
  onReject: () => void;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({ request, onApprove, onReject }) => {
  const isCritical = request.riskLevel === 'critical' || request.riskLevel === 'high';

  return (
    <Card className={cn(
      "border-l-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-lg w-full",
      isCritical ? "border-l-red-500 bg-neutral-900/95" : "border-l-yellow-500 bg-neutral-900/95"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={cn(
          "p-2 rounded-md bg-opacity-10 flex-shrink-0",
          isCritical ? "bg-red-500 text-red-500" : "bg-yellow-500 text-yellow-500"
        )}>
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
            Permission Required
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-neutral-700 bg-neutral-800 uppercase text-neutral-400">
              {request.type.replace('_', ' ')}
            </span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {request.requestedBy} is requesting access to perform a restricted action.
          </p>
        </div>
      </div>

      {/* The Action Details */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-md p-3 mb-4 font-mono text-xs text-neutral-300 overflow-x-auto">
        <div className="flex items-center gap-2 text-neutral-500 mb-1 border-b border-neutral-800 pb-1">
          <ChevronRight className="w-3 h-3" />
          EXECUTE COMMAND
        </div>
        <div className={cn(isCritical ? "text-red-300" : "text-yellow-300")}>
          {request.operation}
        </div>
        {request.details && (
          <pre className="mt-2 text-neutral-500 text-[10px]">
            {JSON.stringify(request.details, null, 2)}
          </pre>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="danger" onClick={onReject} className="gap-2">
          <X className="w-3 h-3" />
          Deny
        </Button>
        <Button 
          onClick={onApprove} 
          className={cn(
            "gap-2 text-neutral-900 font-bold",
            isCritical ? "bg-red-500 hover:bg-red-400" : "bg-yellow-500 hover:bg-yellow-400"
          )}
        >
          <Check className="w-3 h-3" />
          Authorize
        </Button>
      </div>
    </Card>
  );
};