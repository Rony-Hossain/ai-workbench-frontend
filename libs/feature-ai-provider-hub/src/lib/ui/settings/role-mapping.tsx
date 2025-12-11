import React, { useMemo, useState } from 'react';
import { trpc } from '@ai-workbench/shared/client-api';
import { Badge, Button } from '@ai-workbench/shared/ui';
import { useWorkbenchStore } from '@ai-workbench/state-workbench';

const ROLES = ['planner', 'coder', 'reviewer', 'architect', 'debugger'] as const;

type PendingChange = {
  providerId: string;
  modelId: string;
};

export function WorkspaceRoleMapping() {
  const activeWorkspaceId = useWorkbenchStore((state) => state.activeWorkspaceId);
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});

  const { data: providers } = trpc.provider.list.useQuery();
  const { data: mappings, refetch } = trpc.project.getRoleMappings.useQuery(
    { workspaceId: activeWorkspaceId || '' },
    { enabled: !!activeWorkspaceId },
  );
  const saveMutation = trpc.project.updateRoleMapping.useMutation();

  const assignmentMap = useMemo(() => {
    const map: Record<string, PendingChange> = {};
    mappings?.forEach((mapping) => {
      map[mapping.role] = { providerId: mapping.providerId, modelId: mapping.modelId };
    });
    return map;
  }, [mappings]);

  const getAssignment = (role: string): PendingChange => {
    if (pendingChanges[role]) return pendingChanges[role];
    return assignmentMap[role] ?? { providerId: '', modelId: '' };
  };

  const handleSave = async () => {
    if (!activeWorkspaceId || Object.keys(pendingChanges).length === 0) return;
    await Promise.all(
      Object.entries(pendingChanges).map(([role, config]) =>
        saveMutation.mutateAsync({
          workspaceId: activeWorkspaceId,
          role: role as (typeof ROLES)[number],
          providerId: config.providerId,
          modelId: config.modelId,
        }),
      ),
    );
    setPendingChanges({});
    await refetch();
  };

  if (!activeWorkspaceId) {
    return <div className="p-8 text-center text-neutral-500">Select a workspace to configure roles.</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-neutral-900/50 rounded-lg border border-neutral-800">
      <div className="border-b border-primary/30 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-mono font-black text-primary uppercase tracking-wider">&gt; ROLE_MAPPING</h2>
          <p className="text-neutral-500 mt-2 text-xs font-mono uppercase tracking-widest">
            /* assign neural engines to agent roles */
          </p>
        </div>
        {Object.keys(pendingChanges).length > 0 && (
          <Button onClick={handleSave} className="gap-2 shadow-neon-primary animate-pulse">
            Apply Changes
          </Button>
        )}
      </div>

      <div className="overflow-x-auto border border-neutral-800 rounded-lg bg-neutral-950">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-900 text-neutral-400 font-mono text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assigned Model</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {ROLES.map((role) => {
              const assignment = getAssignment(role);
              const isConfigured = !!assignment.providerId;
              const isEdited = !!pendingChanges[role];

              return (
                <tr key={role} className="hover:bg-neutral-900/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-neutral-300 uppercase">{role}</td>
                  <td className="px-4 py-3">
                    <select
                      className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white w-full max-w-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      value={
                        assignment.providerId && assignment.modelId
                          ? `${assignment.providerId}|${assignment.modelId}`
                          : ''
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        setPendingChanges((prev) => {
                          const next = { ...prev };
                          if (!value) {
                            delete next[role];
                            return next;
                          }
                          const [providerId, modelId] = value.split('|');
                          const current = assignmentMap[role];
                          if (current && current.providerId === providerId && current.modelId === modelId) {
                            delete next[role];
                          } else {
                            next[role] = { providerId, modelId };
                          }
                          return next;
                        });
                      }}
                    >
                      <option value="">-- Unassigned --</option>
                      {providers?.map((provider) => (
                        <optgroup key={provider.id} label={provider.label || provider.name}>
                          {provider.models.map((model) => (
                            <option key={model.id} value={`${provider.id}|${model.id}`}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEdited ? (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Modified</Badge>
                    ) : isConfigured ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-neutral-500 border-neutral-700">
                        Empty
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
