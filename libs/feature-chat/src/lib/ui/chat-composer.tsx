"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ai-workbench/shared/ui"
import { Send, Square, Paperclip, X, File, ImageIcon, AlertCircle } from "lucide-react"
import type { Agent, Attachment } from "./types"

interface ChatComposerProps {
  agents: Agent[]
  onSend: (message: string, targetAgent: string, attachments: Attachment[]) => void
  isGenerating?: boolean
  onStop?: () => void
}

export function ChatComposer({ agents, onSend, isGenerating = false, onStop }: ChatComposerProps) {
  const [message, setMessage] = useState("")
  const [targetAgent, setTargetAgent] = useState("all")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedAgent = agents.find((a) => a.id === targetAgent)
  const isAgentOffline = selectedAgent?.status === "offline"

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSend(message, targetAgent, attachments)
      setMessage("")
      setAttachments([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments = files.map((file) => ({
      id: `attach-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type.startsWith("image/") ? ("image" as const) : ("file" as const),
      size: file.size,
      url: URL.createObjectURL(file),
    }))
    setAttachments([...attachments, ...newAttachments])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="border-t border-border bg-card p-4 mb-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">To:</span>
        <Select value={targetAgent} onValueChange={setTargetAgent}>
          <SelectTrigger className="w-[220px] border-border bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span className="font-medium">All Agents</span>
              </div>
            </SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  <span>{agent.name}</span>
                  <span className="text-xs text-muted-foreground">({agent.model})</span>
                  {agent.status === "offline" && (
                    <span className="h-2 w-2 rounded-full bg-destructive" title="Offline" />
                  )}
                  {agent.status === "online" && <span className="h-2 w-2 rounded-full bg-green-500" title="Online" />}
                  {agent.status === "thinking" && (
                    <span className="h-2 w-2 rounded-full bg-yellow-500" title="Thinking" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAgentOffline && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>Agent offline</span>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2"
              >
                {attachment.type === "image" ? (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <File className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{attachment.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                </div>
                <button
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="ml-2 rounded-md p-1 hover:bg-accent"
                  aria-label="Remove attachment"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative flex items-end gap-2 rounded-lg border border-input bg-background p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          title="Add attachments"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.txt,.doc,.docx,.csv,.json"
        />

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="min-h-[24px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />

        {isGenerating ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onStop}
            className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            title="Stop generating"
          >
            <Square className="h-5 w-5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
            className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10 hover:text-primary disabled:text-muted-foreground disabled:hover:bg-transparent"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>

      {isAgentOffline && (
        <p className="mt-2 text-xs text-muted-foreground">
          This agent is currently not available. You can still send, but it may fail.
        </p>
      )}
    </div>
  )
}