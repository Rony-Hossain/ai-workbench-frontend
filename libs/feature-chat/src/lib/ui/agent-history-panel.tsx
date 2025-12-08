"use client"
import { useState } from "react"
import { Bot, Search, Filter } from "lucide-react"
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ai-workbench/shared/ui"
import type { AgentHistoryItem } from "./types"

interface AgentHistoryPanelProps {
  items: AgentHistoryItem[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  height: number
  onResize: (height: number) => void
  otherPanelsCollapsed: boolean
}

export function AgentHistoryPanel({
  items,
  isCollapsed,
  onToggleCollapse,
  height,
  onResize,
  otherPanelsCollapsed,
}: AgentHistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.action.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: AgentHistoryItem["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-500"
      case "failed":
        return "text-destructive"
      case "in_progress":
        return "text-yellow-500"
    }
  }

  const getStatusText = (status: AgentHistoryItem["status"]) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "failed":
        return "Failed"
      case "in_progress":
        return "In Progress"
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Agent History</h3>
        </div>
      </div>

      <div className="p-3 space-y-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search agent actions..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Bot className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No agent history</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium">{item.agentName}</div>
                    <div className="text-xs text-muted-foreground">{item.model}</div>
                  </div>
                </div>
                <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>

              <div className="text-sm mb-2">{item.action}</div>

              <div className="text-xs text-muted-foreground mb-1">{item.details}</div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.timestamp.toLocaleTimeString()}</span>
                {item.duration && <span>{item.duration}ms</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}