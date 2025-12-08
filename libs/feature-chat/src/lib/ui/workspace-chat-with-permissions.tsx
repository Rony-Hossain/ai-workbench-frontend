"use client"

import { useState } from "react"
import { ChatHeader } from "./chat-header"
import { MessageBubble } from "./message-bubble"
import { PermissionCard } from "./permission-card"
import { RememberPreferenceDialog } from "./remember-preference-dialog"
import { EditPermissionActionsModal } from "./edit-permission-actions-modal"
import { HistorySidebar } from "./history-sidebar"
import { ChatComposer } from "./chat-composer"
import type {
  Agent,
  User,
  Message,
  PermissionHistoryItem,
  ConversationHistoryItem,
  AgentHistoryItem,
} from "./types"

interface WorkspaceChatWithPermissionsProps {
  workspaceName: string
  users: User[]
  agents: Agent[]
  messages: Message[]
  permissionHistory: PermissionHistoryItem[]
  conversationHistory: ConversationHistoryItem[]
  agentHistory: AgentHistoryItem[]
  showHistoryPanel?: boolean
  showConversationPanel?: boolean
  showAgentPanel?: boolean
  onSendMessage: (content: string, targetAgent: string, attachments: any[]) => void;
  isGenerating: boolean;
  onStop: () => void;
}

export function WorkspaceChatWithPermissions({
  workspaceName,
  users,
  agents,
  messages: initialMessages,
  permissionHistory,
  conversationHistory,
  agentHistory,
  showHistoryPanel = false,
  showConversationPanel = false,
  showAgentPanel = false,
  onSendMessage,
  isGenerating,
  onStop
}: WorkspaceChatWithPermissionsProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [rememberDialogOpen, setRememberDialogOpen] = useState(false)
  const [editActionsModalOpen, setEditActionsModalOpen] = useState(false)
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null)

  const selectedPermission = messages.find((m) => m.type === "permission" && m.id === selectedPermissionId)

  const handleAllowPermission = (permissionId: string, actionIds: string[]) => {
    setMessages(
      messages.map((m) =>
        m.id === permissionId && m.permissionData
          ? {
              ...m,
              permissionData: {
                ...m.permissionData,
                status: "approved_once",
              },
            }
          : m,
      ),
    )
  }

  const handleAllowAndRemember = (permissionId: string, actionIds: string[]) => {
    setSelectedPermissionId(permissionId)
    setRememberDialogOpen(true)
  }

  const handleSaveRule = (rule: any) => {
    if (selectedPermissionId) {
      setMessages(
        messages.map((m) =>
          m.id === selectedPermissionId && m.permissionData
            ? {
                ...m,
                permissionData: {
                  ...m.permissionData,
                  status: "approved_with_rule",
                  ruleName: rule.description || "Custom rule",
                },
              }
            : m,
        ),
      )
    }
    setSelectedPermissionId(null)
  }

  const handleDenyPermission = (permissionId: string) => {
    setMessages(
      messages.map((m) =>
        m.id === permissionId && m.permissionData
          ? {
              ...m,
              permissionData: {
                ...m.permissionData,
                status: "denied",
              },
            }
          : m,
      ),
    )
  }

  const handleEditActions = (permissionId: string) => {
    setSelectedPermissionId(permissionId)
    setEditActionsModalOpen(true)
  }

  const handleConfirmEditedActions = (selectedActionIds: string[]) => {
    if (selectedPermissionId) {
      setMessages(
        messages.map((m) =>
          m.id === selectedPermissionId && m.permissionData
            ? {
                ...m,
                permissionData: {
                  ...m.permissionData,
                  actions: m.permissionData.actions.map((a) => ({
                    ...a,
                    checked: selectedActionIds.includes(a.id),
                  })),
                },
              }
            : m,
        ),
      )
    }
    setSelectedPermissionId(null)
  }

  return (
    <div className="flex h-screen">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        <ChatHeader workspaceName={workspaceName} users={users} agents={agents} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {messages.map((message) =>
              message.type === "permission" && message.permissionData ? (
                <PermissionCard
                  key={message.id}
                  data={message.permissionData}
                  onAllow={handleAllowPermission}
                  onAllowAndRemember={handleAllowAndRemember}
                  onDeny={handleDenyPermission}
                  onEdit={handleEditActions}
                />
              ) : (
                <MessageBubble key={message.id} message={message} />
              ),
            )}
          </div>

          <ChatComposer agents={agents} onSend={onSendMessage} isGenerating={isGenerating} onStop={onStop} />
        </div>
      </div>

      {/* History sidebar - full height */}
      {(showHistoryPanel || showConversationPanel || showAgentPanel) && (
        <HistorySidebar
          workspaceName={workspaceName}
          permissionHistory={permissionHistory}
          conversationHistory={conversationHistory}
          agentHistory={agentHistory}
          showPermissionPanel={showHistoryPanel}
          showConversationPanel={showConversationPanel}
          showAgentPanel={showAgentPanel}
        />
      )}

      {selectedPermission?.permissionData && (
        <>
          <RememberPreferenceDialog
            open={rememberDialogOpen}
            onOpenChange={setRememberDialogOpen}
            agentName={selectedPermission.permissionData.agent.name}
            actions={selectedPermission.permissionData.actions.filter((a) => a.checked).map((a) => a.summary)}
            onSave={handleSaveRule}
          />

          <EditPermissionActionsModal
            open={editActionsModalOpen}
            onOpenChange={setEditActionsModalOpen}
            actions={selectedPermission.permissionData.actions}
            onConfirm={handleConfirmEditedActions}
          />
        </>
      )}
    </div>
  )
}