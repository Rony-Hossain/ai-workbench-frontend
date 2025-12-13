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
  messages: Message[] // <--- This is now our Source of Truth
  permissionHistory: PermissionHistoryItem[]
  conversationHistory: ConversationHistoryItem[]
  agentHistory: AgentHistoryItem[]
  showHistoryPanel?: boolean
  showConversationPanel?: boolean
  showAgentPanel?: boolean
  onSendMessage: (content: string, targetAgent: string, attachments: any[]) => void;
  onSelectConversation?: (id: string) => void; // Added this
  isGenerating: boolean;
  onStop: () => void;
}

export function WorkspaceChatWithPermissions({
  workspaceName,
  users,
  agents,
  messages, // Use prop directly
  permissionHistory,
  conversationHistory,
  agentHistory,
  showHistoryPanel = false,
  showConversationPanel = false,
  showAgentPanel = false,
  onSendMessage,
  onSelectConversation,
  isGenerating,
  onStop
}: WorkspaceChatWithPermissionsProps) {
  // REMOVED: const [messages, setMessages] = useState(initialMessages) <--- THE BUG IS GONE

  // Local UI state for modals is fine
  const [rememberDialogOpen, setRememberDialogOpen] = useState(false)
  const [editActionsModalOpen, setEditActionsModalOpen] = useState(false)
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null)

  const selectedPermission = messages.find((m) => m.type === "permission" && m.id === selectedPermissionId)

  // NOTE: These handlers need to call backend mutations in the future.
  // For now, they are UI placeholders since we don't have a permission router yet.
  const handleAllowPermission = (permissionId: string, actionIds: string[]) => {
    console.log("Allow:", permissionId, actionIds);
  }

  const handleAllowAndRemember = (permissionId: string, actionIds: string[]) => {
    setSelectedPermissionId(permissionId)
    setRememberDialogOpen(true)
  }

  const handleSaveRule = (rule: any) => {
    console.log("Save Rule:", rule);
    setSelectedPermissionId(null)
  }

  const handleDenyPermission = (permissionId: string) => {
    console.log("Deny:", permissionId);
  }

  const handleEditActions = (permissionId: string) => {
    setSelectedPermissionId(permissionId)
    setEditActionsModalOpen(true)
  }

  const handleConfirmEditedActions = (selectedActionIds: string[]) => {
    console.log("Confirm Actions:", selectedActionIds);
    setSelectedPermissionId(null)
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-200">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        <ChatHeader workspaceName={workspaceName} users={users} agents={agents} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                Start the operation, Commander.
              </div>
            ) : (
              messages.map((message) =>
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
              )
            )}
          </div>

          <ChatComposer agents={agents} onSend={onSendMessage} isGenerating={isGenerating} onStop={onStop} />
        </div>
      </div>

      {/* History sidebar */}
      <HistorySidebar
        workspaceName={workspaceName}
        permissionHistory={permissionHistory}
        conversationHistory={conversationHistory}
        agentHistory={agentHistory}
        showPermissionPanel={showHistoryPanel}
        showConversationPanel={showConversationPanel}
        showAgentPanel={showAgentPanel}
        onSelectConversation={onSelectConversation}
      />

      {/* Modals */}
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