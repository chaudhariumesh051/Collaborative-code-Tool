"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileExplorer } from "@/components/file-explorer"
import { CodeEditor } from "@/components/code-editor"
import { ChatPanel } from "@/components/chat-panel"
import { UserPresence } from "@/components/user-presence"
import { Toolbar } from "@/components/toolbar"
import { InviteDialog } from "@/components/invite-dialog"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2, Wifi, WifiOff } from "lucide-react"
import { useProject } from "@/hooks/use-project"
import { useRealtime } from "@/hooks/use-realtime"
import { Badge } from "@/components/ui/badge"

interface EditorLayoutProps {
  user: any
  project: any
}

export function EditorLayout({ user, project }: EditorLayoutProps) {
  const router = useRouter()
  const { updateProject, exportProject } = useProject()
  const {
    files,
    collaborators,
    connected,
    initializeRealtime,
    updateFileContent,
    updateCursor,
    createFile,
    deleteFile,
    renameFile,
  } = useRealtime(project.id)

  const [currentFile, setCurrentFile] = useState<any>(null)
  const [showChat, setShowChat] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  useEffect(() => {
    // Initialize realtime collaboration
    const cleanup = initializeRealtime(project.file_structure || [], user)
    return cleanup
  }, [project.id, project.file_structure, user, initializeRealtime])

  useEffect(() => {
    // Set initial current file
    if (files.length > 0 && !currentFile) {
      setCurrentFile(files[0])
    }
  }, [files, currentFile])

  const handleExportProject = async () => {
    const result = await exportProject(project.id)
    if (!result.success) {
      alert(`Export failed: ${result.error}`)
    }
  }

  const handleSaveProject = async () => {
    const result = await updateProject(project.id, {
      file_structure: files,
    })
    if (!result.success) {
      alert(`Save failed: ${result.error}`)
    }
  }

  const handleFileSelect = (file: any) => {
    setCurrentFile(file)
  }

  const handleFileContentChange = (fileId: string, content: string) => {
    updateFileContent(fileId, content)

    // Auto-save to database periodically
    const autoSave = setTimeout(() => {
      handleSaveProject()
    }, 2000)

    return () => clearTimeout(autoSave)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <Badge variant={connected ? "secondary" : "destructive"} className="text-xs">
              {connected ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
          <div className="text-sm text-gray-500">{currentFile ? currentFile.name : "No file selected"}</div>
        </div>

        <div className="flex items-center space-x-4">
          <UserPresence collaborators={collaborators} currentUser={user} project={project} />

          <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Invite
          </Button>

          <Toolbar
            onToggleChat={() => setShowChat(!showChat)}
            onExport={handleExportProject}
            onSave={handleSaveProject}
            showChat={showChat}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <FileExplorer
              files={files}
              currentFile={currentFile}
              onFileSelect={handleFileSelect}
              onFileCreate={createFile}
              onFileDelete={deleteFile}
              onFileRename={renameFile}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Editor Area */}
          <ResizablePanel defaultSize={showChat ? 50 : 70}>
            <div className="h-full flex flex-col">
              {currentFile ? (
                <CodeEditor
                  file={currentFile}
                  collaborators={collaborators}
                  currentUser={user}
                  onContentChange={handleFileContentChange}
                  onCursorChange={updateCursor}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-lg font-medium mb-2">No file selected</h3>
                    <p>Select a file from the explorer or create a new one</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* Chat Panel */}
          {showChat && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                <div className="h-full bg-white border-l">
                  <ChatPanel currentUser={user} collaborators={collaborators} projectId={project.id} />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Invite Dialog */}
      <InviteDialog open={showInviteDialog} onOpenChange={setShowInviteDialog} project={project} currentUser={user} />
    </div>
  )
}
