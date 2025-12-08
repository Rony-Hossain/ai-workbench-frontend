import { ParticipantChip } from "./participant-chip"
import type { Agent, User } from "./types"

interface ChatHeaderProps {
  workspaceName: string
  users: User[]
  agents: Agent[]
}

export function ChatHeader({ workspaceName, users, agents }: ChatHeaderProps) {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Workspace: {workspaceName}</h1>
          <p className="text-sm text-muted-foreground">Chat & Agents</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {users.map((user) => (
            <ParticipantChip key={user.id} participant={user} type="user" />
          ))}
          {agents.map((agent) => (
            <ParticipantChip key={agent.id} participant={agent} type="agent" />
          ))}
        </div>
      </div>
    </header>
  )
}