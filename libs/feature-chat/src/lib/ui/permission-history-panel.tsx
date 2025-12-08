"use client"

import { useState } from "react"
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ai-workbench/shared/ui"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import type { PermissionHistoryItem } from "./types"
import { cn } from "@ai-workbench/shared/utils"

interface PermissionHistoryPanelProps {
  items: PermissionHistoryItem[]
  onViewDetails?: (itemId: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  height: number
  onResize: (newHeight: number) => void
  conversationPanelCollapsed: boolean
}

const statusIcons = {
  pending: AlertCircle,
  approved_once: CheckCircle2,
  approved_with_rule: CheckCircle2,
  denied: XCircle,
  failed: AlertCircle,
}

const statusColors = {
  pending: "text-yellow-500",
  approved_once: "text-green-500",
  approved_with_rule: "text-blue-500",
  denied: "text-destructive",
  failed: "text-red-500",
}

export function PermissionHistoryPanel({
  items,
  onViewDetails,
  isCollapsed,
  onToggleCollapse,
  height,
  onResize,
  conversationPanelCollapsed,
}: PermissionHistoryPanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [agentFilter, setAgentFilter] = useState<string>("all")

  const uniqueAgents = Array.from(new Set(items.map((item) => item.agent.name)))

  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesAgent = agentFilter === "all" || item.agent.name === agentFilter
    return matchesStatus && matchesAgent
  })

  return (
    <aside className="h-full border-border bg-card flex flex-col">
      <div className="flex h-full flex-col">
        <div className="border-b border-border p-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Permission History</h2>
        </div>

        <div className="space-y-2 border-b border-border p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="approved_once">Approved</SelectItem>
              <SelectItem value="approved_with_rule">Approved (rule)</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {uniqueAgents.map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const Icon = statusIcons[item.status]
              return (
                <div key={item.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Icon className={cn("h-4 w-4 flex-shrink-0 mt-0.5", statusColors[item.status])} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground text-balance">{item.summary}</p>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p>
                          {item.agent.name} ({item.agent.model})
                        </p>
                        {item.approver && <p>By: {item.approver.name}</p>}
                        <p>{item.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-accent"
                    onClick={() => onViewDetails?.(item.id)}
                  >
                    View details
                  </Button>
                </div>
              )
            })}

            {filteredItems.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No permission requests found</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}