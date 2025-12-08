"use client"

import type React from "react"
import { useState } from "react"
import { PermissionHistoryPanel } from "./permission-history-panel"
import { ConversationHistoryPanel } from "./conversation-history-panel"
import { AgentHistoryPanel } from "./agent-history-panel"
import { ShieldCheck, MessageSquare, Bot } from "lucide-react"
import { Button } from "@ai-workbench/shared/ui"
import type { PermissionHistoryItem, ConversationHistoryItem, AgentHistoryItem } from "./types"

interface HistorySidebarProps {
  workspaceName: string
  permissionHistory: PermissionHistoryItem[]
  conversationHistory: ConversationHistoryItem[]
  agentHistory: AgentHistoryItem[]
  showPermissionPanel?: boolean
  showConversationPanel?: boolean
  showAgentPanel?: boolean
  onSelectConversation?: (id: string) => void
}

type ActivePanel = "permissions" | "conversations" | "agents" | null

export function HistorySidebar({
  workspaceName,
  permissionHistory,
  conversationHistory,
  agentHistory,
  showPermissionPanel = true,
  showConversationPanel = true,
  showAgentPanel = true,
  onSelectConversation,
}: HistorySidebarProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>("conversations")
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isDraggingWidth, setIsDraggingWidth] = useState(false)

  const isCollapsed = activePanel === null

  const handleWidthResize = (newWidth: number) => {
    setSidebarWidth(newWidth)
    if (newWidth < 100 && !isCollapsed) {
      setActivePanel(null)
    }
  }

  const handleMouseDownWidth = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingWidth(true)

    const startX = e.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX
      const newWidth = Math.max(48, Math.min(600, startWidth + deltaX))
      handleWidthResize(newWidth)
    }

    const handleMouseUp = () => {
      setIsDraggingWidth(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleIconClick = (panel: ActivePanel) => {
    if (activePanel === panel) {
      setActivePanel(null)
    } else {
      setActivePanel(panel)
      if (isCollapsed) {
        setSidebarWidth(320)
      }
    }
  }

  return (
    <div className="relative flex h-full" style={{ width: `${isCollapsed ? 48 : sidebarWidth}px` }}>
      {!isCollapsed && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors z-10 ${
            isDraggingWidth ? "bg-primary" : ""
          }`}
          onMouseDown={handleMouseDownWidth}
        />
      )}

      {isCollapsed ? (
        <div className="flex flex-col w-12 border-l border-border bg-card">
          {showPermissionPanel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleIconClick("permissions")}
              className="h-12 w-12 p-0 hover:bg-accent rounded-none flex items-center justify-center"
              title="Permission History"
            >
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
          {showConversationPanel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleIconClick("conversations")}
              className="h-12 w-12 p-0 hover:bg-accent rounded-none flex items-center justify-center"
              title="Conversation History"
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
          {showAgentPanel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleIconClick("agents")}
              className="h-12 w-12 p-0 hover:bg-accent rounded-none flex items-center justify-center"
              title="Agent History"
            >
              <Bot className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 border-l border-border h-full">
          <div className="flex flex-row border-b border-border bg-muted/30">
            {showPermissionPanel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleIconClick("permissions")}
                className={`h-10 flex-1 rounded-none ${activePanel === "permissions" ? "bg-accent border-b-2 border-primary" : ""}`}
                title="Permission History"
              >
                <ShieldCheck className="h-4 w-4" />
              </Button>
            )}
            {showConversationPanel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleIconClick("conversations")}
                className={`h-10 flex-1 rounded-none ${activePanel === "conversations" ? "bg-accent border-b-2 border-primary" : ""}`}
                title="Conversation History"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            {showAgentPanel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleIconClick("agents")}
                className={`h-10 flex-1 rounded-none ${activePanel === "agents" ? "bg-accent border-b-2 border-primary" : ""}`}
                title="Agent History"
              >
                <Bot className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {activePanel === "permissions" && showPermissionPanel && (
              <div className="h-full">
                <PermissionHistoryPanel
                  items={permissionHistory}
                  isCollapsed={false}
                  onToggleCollapse={() => setActivePanel(null)}
                  height={0}
                  onResize={() => {}}
                  conversationPanelCollapsed={true}
                />
              </div>
            )}
            {activePanel === "conversations" && showConversationPanel && (
              <div className="h-full">
                <ConversationHistoryPanel
                  workspaceName={workspaceName}
                  conversations={conversationHistory}
                  onSelectConversation={onSelectConversation || ((id) => console.log("Selected conversation:", id))}
                  isCollapsed={false}
                  onToggleCollapse={() => setActivePanel(null)}
                  height={0}
                  onResize={() => {}}
                  permissionPanelCollapsed={true}
                />
              </div>
            )}
            {activePanel === "agents" && showAgentPanel && (
              <div className="h-full">
                <AgentHistoryPanel
                  items={agentHistory}
                  isCollapsed={false}
                  onToggleCollapse={() => setActivePanel(null)}
                  height={0}
                  onResize={() => {}}
                  otherPanelsCollapsed={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}