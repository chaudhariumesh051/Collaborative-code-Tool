"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Settings, Download, Play, Bug, GitBranch, Save } from "lucide-react"

interface ToolbarProps {
  onToggleChat: () => void
  onExport: () => void
  onSave: () => void
  showChat: boolean
}

export function Toolbar({ onToggleChat, onExport, onSave, showChat }: ToolbarProps) {
  return (
    <div className="flex items-center space-x-1">
      <Button size="sm" variant={showChat ? "default" : "ghost"} onClick={onToggleChat}>
        <MessageSquare className="h-4 w-4 mr-1" />
        Chat
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="ghost" onClick={onSave}>
        <Save className="h-4 w-4 mr-1" />
        Save
      </Button>

      <Button size="sm" variant="ghost">
        <Play className="h-4 w-4 mr-1" />
        Run
      </Button>

      <Button size="sm" variant="ghost">
        <Bug className="h-4 w-4 mr-1" />
        Debug
      </Button>

      <Button size="sm" variant="ghost">
        <GitBranch className="h-4 w-4 mr-1" />
        Branch
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="ghost" onClick={onExport}>
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>

      <Button size="sm" variant="ghost">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
}
