"use client"

import { Avatar, AvatarFallback, AvatarImage, Button } from "@ai-workbench/shared/ui"
import { AlertCircle, Loader2 } from "lucide-react"
import type { Message } from "./types"

interface MessageBubbleProps {
  message: Message
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onRetryWithFallback?: (messageId: string) => void
  onChangeAgent?: (messageId: string) => void
}

export function MessageBubble({ message, onRetry, onEdit, onRetryWithFallback, onChangeAgent }: MessageBubbleProps) {
  const isHuman = message.type === "human"
  const showThinking = message.status === "agent_thinking"
  const showUnavailable = message.status === "agent_unavailable"
  const showFailed = message.status === "failed"
  const showSending = message.status === "sending"

  return (
    <div className="flex gap-3 px-6 py-4">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.senderAvatar || "/placeholder.svg"} alt={message.senderName} />
        <AvatarFallback className="text-xs">{message.senderName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-foreground">
            {message.senderName}
            {message.model && <span className="ml-1 text-xs font-normal text-muted-foreground">({message.model})</span>}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {message.targetAgent && <span className="text-xs text-accent">to: {message.targetAgent}</span>}
        </div>

        {showThinking ? (
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="thinking-dot">•</span>
                <span className="thinking-dot">•</span>
                <span className="thinking-dot">•</span>
              </div>
              <span>{message.senderName} is thinking...</span>
            </div>
          </div>
        ) : showUnavailable ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{message.senderName} is not available (model offline)</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onRetryWithFallback?.(message.id)}>
                Retry with fallback
              </Button>
              <Button size="sm" variant="outline" onClick={() => onChangeAgent?.(message.id)}>
                Change agent
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-foreground">{message.content}</div>
        )}

        {showSending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Sending...</span>
          </div>
        )}

        {showFailed && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Message not sent</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onRetry?.(message.id)}>
                Retry
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit?.(message.id)}>
                Edit & resend
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}