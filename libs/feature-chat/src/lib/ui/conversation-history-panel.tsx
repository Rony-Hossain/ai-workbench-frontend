"use client"
import { useState } from "react"
import { Button, Input } from "@ai-workbench/shared/ui"
import { MessageSquare, Search } from "lucide-react"
import type { ConversationHistoryItem } from "./types"
import { cn } from "@ai-workbench/shared/utils"

interface ConversationHistoryPanelProps {
  workspaceName: string
  conversations: ConversationHistoryItem[]
  onSelectConversation?: (conversationId: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  height: number
  onResize: (newHeight: number) => void
  permissionPanelCollapsed: boolean
  permissionPanelHeight: number
}

export function ConversationHistoryPanel({
  workspaceName,
  conversations,
  onSelectConversation,
  isCollapsed,
  onToggleCollapse,
  height,
  onResize,
  permissionPanelCollapsed,
}: ConversationHistoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const panelStyle = isCollapsed
    ? { height: "48px" }
    : permissionPanelCollapsed
      ? { flex: 1 }
      : { height: `${height}px`, flexShrink: 0 }

  return (
    <aside style={panelStyle} className="bg-card flex-shrink-0 transition-all relative flex flex-col">
      <div className="flex h-full flex-col">
        {isCollapsed ? (
          <div className="flex items-center justify-center h-full">
            <Button
              variant="ghost"
              size="sm"
              className="h-full w-full p-0 hover:bg-accent/50 rounded-none flex flex-col items-center justify-center gap-1"
              onClick={onToggleCollapse}
              title="Conversation History"
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Chats</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-border p-2 flex items-center justify-between flex-shrink-0">
              <div className="flex-1 px-2">
                <h2 className="font-semibold text-foreground text-sm">Conversations</h2>
                <p className="text-xs text-muted-foreground">{workspaceName}</p>
              </div>
            </div>

            <div className="p-4 border-b border-border flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => onSelectConversation?.(conversation.id)}
                    className={cn(
                      "w-full rounded-lg p-3 text-left transition-colors hover:bg-accent/50",
                      conversation.isActive && "bg-accent",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{conversation.title}</p>
                          {conversation.isActive && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{conversation.lastMessage}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{conversation.messageCount} messages</span>
                          <span>{formatTimestamp(conversation.timestamp)}</span>
                        </div>
                        {conversation.participants.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {conversation.participants.map((participant, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                              >
                                {participant}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-center text-sm text-muted-foreground">
                      {searchQuery ? "No conversations found" : "No conversation history yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {conversations.length > 0 && (
              <div className="border-t border-border p-4 flex-shrink-0">
                <Button className="w-full bg-transparent" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}