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
  RadioGroup,
  RadioGroupItem,
  Label,
  Textarea,
  Input
} from "@ai-workbench/shared/ui"

interface RememberPreferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentName: string
  actions: string[]
  onSave: (rule: {
    scope: "exact" | "path" | "all"
    path?: string
    description?: string
  }) => void
}

export function RememberPreferenceDialog({
  open,
  onOpenChange,
  agentName,
  actions,
  onSave,
}: RememberPreferenceDialogProps) {
  const [scope, setScope] = useState<"exact" | "path" | "all">("exact")
  const [path, setPath] = useState("src/api/**")
  const [description, setDescription] = useState("")

  const handleSave = () => {
    onSave({
      scope,
      path: scope === "path" ? path : undefined,
      description: description || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Remember this permission as a rule</DialogTitle>
          <DialogDescription>Choose how broadly this permission should apply in the future.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={scope} onValueChange={(v) => setScope(v as any)}>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="exact" id="exact" className="mt-1" />
              <Label htmlFor="exact" className="font-normal">
                <div className="font-semibold">This agent + these exact actions in this workspace</div>
                <div className="text-sm text-muted-foreground">Only applies to: {actions.join(", ")}</div>
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="path" id="path" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="path" className="font-normal">
                  <div className="font-semibold">This agent + any file under a path</div>
                </Label>
                <Input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="e.g., src/api/**"
                  disabled={scope !== "path"}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="all" id="all" className="mt-1" />
              <Label htmlFor="all" className="font-normal">
                <div className="font-semibold">All file modifications by this agent</div>
                <div className="text-sm text-muted-foreground">{agentName} can modify any file in this workspace</div>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="description">Rule description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Allow API modifications for testing"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save rule & Allow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}