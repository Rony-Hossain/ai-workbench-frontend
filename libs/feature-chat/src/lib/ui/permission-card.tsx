"use client"

import { useState } from "react"
import { Card, Button, Badge, Checkbox } from "@ai-workbench/shared/ui"
import { ShieldAlert, FileText, FilePlus, Terminal, Network, Key, ChevronDown, ChevronUp } from "lucide-react"
import type { PermissionCardData, ActionType } from "./types"
import { cn } from "@ai-workbench/shared/utils"

interface PermissionCardProps {
  data: PermissionCardData
  onAllow?: (permissionId: string, actionIds: string[]) => void
  onAllowAndRemember?: (permissionId: string, actionIds: string[]) => void
  onDeny?: (permissionId: string) => void
  onEdit?: (permissionId: string) => void
}

const actionIcons: Record<ActionType, any> = {
  file_modify: FileText,
  file_create: FilePlus,
  command: Terminal,
  network: Network,
  secret: Key,
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  approved_once: "bg-green-500/20 text-green-500 border-green-500/30",
  approved_with_rule: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  denied: "bg-destructive/20 text-destructive border-destructive/30",
  failed: "bg-red-500/20 text-red-500 border-red-500/30",
}

const riskLevelColors = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
}

export function PermissionCard({ data, onAllow, onAllowAndRemember, onDeny, onEdit }: PermissionCardProps) {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())
  const isPending = data.status === "pending"

  const toggleActionDetails = (actionId: string) => {
    setExpandedActions((prev) => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }

  const getCheckedActionIds = () => {
    return data.actions.filter((a) => a.checked).map((a) => a.id)
  }

  return (
    <Card className="mx-6 my-4 border-2 border-accent/30 bg-card/50 backdrop-blur-sm">
      <div className="space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/20 p-2">
              <ShieldAlert className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Permission Request</h3>
              {data.ruleName && <p className="text-xs text-muted-foreground">Rule: {data.ruleName}</p>}
            </div>
          </div>
          <Badge variant="outline" className={cn("uppercase", statusColors[data.status])}>
            {data.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Context Info */}
        <div className="grid gap-2 rounded-lg bg-muted/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Agent:</span>
            <span className="font-medium text-foreground">
              {data.agent.name} ({data.agent.model}, role: {data.agent.role})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Requested by:</span>
            <span className="font-medium text-foreground">{data.requestedBy.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Workspace:</span>
            <span className="font-medium text-foreground">{data.workspace}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">When:</span>
            <span className="font-medium text-foreground">{data.requestedAt.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Actions requested:</h4>
          <div className="space-y-2">
            {data.actions.map((action) => {
              const Icon = actionIcons[action.type]
              const isExpanded = expandedActions.has(action.id)

              return (
                <div key={action.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox id={action.id} checked={action.checked} disabled={!isPending} className="mt-1" />
                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <label htmlFor={action.id} className="cursor-pointer font-medium text-foreground">
                        {action.summary}
                      </label>
                      {action.details && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-accent"
                          onClick={() => toggleActionDetails(action.id)}
                        >
                          {isExpanded ? (
                            <>
                              Hide details <ChevronUp className="ml-1 h-3 w-3" />
                            </>
                          ) : (
                            <>
                              View details <ChevronDown className="ml-1 h-3 w-3" />
                            </>
                          )}
                        </Button>
                      )}
                      {isExpanded && action.details && (
                        <pre className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground overflow-x-auto">
                          {action.details}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Reason from agent:</h4>
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground">{data.reason}</div>
        </div>

        {/* Risk Level */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Risk level:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("uppercase", riskLevelColors[data.riskLevel])}>
              {data.riskLevel}
            </Badge>
            {data.riskTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button onClick={() => onAllow?.(data.id, getCheckedActionIds())} variant="default">
              Allow
            </Button>
            <Button onClick={() => onAllowAndRemember?.(data.id, getCheckedActionIds())} variant="secondary">
              Allow & remember
            </Button>
            <Button onClick={() => onDeny?.(data.id)} variant="destructive">
              Deny
            </Button>
            <Button onClick={() => onEdit?.(data.id)} variant="outline">
              Edit actions
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}