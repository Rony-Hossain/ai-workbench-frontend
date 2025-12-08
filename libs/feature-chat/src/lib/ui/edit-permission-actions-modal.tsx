"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Checkbox
} from "@ai-workbench/shared/ui"
import { FileText, FilePlus, Terminal, Network, Key, ChevronDown, ChevronUp } from "lucide-react"
import type { PermissionAction, ActionType } from "./types"

interface EditPermissionActionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actions: PermissionAction[]
  onConfirm: (selectedActionIds: string[]) => void
}

const actionIcons: Record<ActionType, any> = {
  file_modify: FileText,
  file_create: FilePlus,
  command: Terminal,
  network: Network,
  secret: Key,
}

export function EditPermissionActionsModal({
  open,
  onOpenChange,
  actions: initialActions,
  onConfirm,
}: EditPermissionActionsModalProps) {
  const [actions, setActions] = useState(initialActions)
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())

  const toggleAction = (actionId: string) => {
    setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, checked: !a.checked } : a)))
  }

  const toggleActionDetails = (actionId: string) => {
    setExpandedActions((prev) => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }

  const resetToOriginal = () => {
    setActions(initialActions)
  }

  const handleConfirm = () => {
    const selectedIds = actions.filter((a) => a.checked).map((a) => a.id)
    onConfirm(selectedIds)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Requested Actions</DialogTitle>
          <DialogDescription>
            Select which actions you want to allow. Unchecked actions will be denied.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-2 overflow-y-auto py-4">
          {actions.map((action) => {
            const Icon = actionIcons[action.type]
            const isExpanded = expandedActions.has(action.id)

            return (
              <div key={action.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`edit-${action.id}`}
                    checked={action.checked}
                    onCheckedChange={() => toggleAction(action.id)}
                    className="mt-1"
                  />
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <label htmlFor={`edit-${action.id}`} className="cursor-pointer font-medium text-foreground">
                      {action.summary}
                    </label>
                    {action.details && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-accent"
                        onClick={() => toggleActionDetails(action.id)}
                      >
                        {isExpanded ? (
                          <>
                            Hide details <ChevronUp className="ml-1 h-3 w-3" />
                          </>
                        ) : (
                          <>
                            View details <ChevronDown className="ml-1 h-3 w-3" />
                          </>
                        )}
                      </Button>
                    )}
                    {isExpanded && action.details && (
                      <pre className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground overflow-x-auto">
                        {action.details}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={resetToOriginal}>
            Reset to original
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Confirm & Allow</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}