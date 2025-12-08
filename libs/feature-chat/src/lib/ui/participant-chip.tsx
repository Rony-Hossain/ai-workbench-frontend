import { Avatar, AvatarFallback, AvatarImage } from "@ai-workbench/shared/ui"
import { cn } from "@ai-workbench/shared/utils"
import type { Agent, User } from "./types"

interface ParticipantChipProps {
  participant: Agent | User
  type: "agent" | "user"
}

export function ParticipantChip({ participant, type }: ParticipantChipProps) {
  const status = type === "agent" ? (participant as Agent).status : undefined
  const model = type === "agent" ? (participant as Agent).model : undefined

  const statusColor = {
    online: "bg-green-500",
    offline: "bg-destructive",
    thinking: "bg-yellow-500",
    error: "bg-destructive",
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
      <div className="relative">
        <Avatar className="h-6 w-6">
          <AvatarImage src={participant.avatar || "/placeholder.svg"} alt={participant.name} />
          <AvatarFallback className="text-xs">{participant.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        {status && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
              statusColor[status],
            )}
          />
        )}
      </div>
      <span className="font-medium text-foreground">{participant.name}</span>
      {model && <span className="text-xs text-muted-foreground">({model})</span>}
    </div>
  )
}