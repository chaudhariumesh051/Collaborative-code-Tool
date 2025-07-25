"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Folder, FolderOpen, File, Plus, Search, FileText, Code, ImageIcon, Database, FolderPlus } from "lucide-react"

interface FileExplorerProps {
  files: any[]
  currentFile: any
  onFileSelect: (file: any) => void
  onFileCreate: (name: string, type?: "file" | "folder") => void
  onFileDelete: (fileId: string) => void
  onFileRename: (fileId: string, newName: string) => void
}

export function FileExplorer({
  files,
  currentFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
}: FileExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))
  const [newFileName, setNewFileName] = useState("")
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileType, setNewFileType] = useState<"file" | "folder">("file")

  const getFileIcon = (filename: string, type: string) => {
    if (type === "folder") {
      return <Folder className="h-4 w-4 text-blue-500" />
    }

    const ext = filename.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "py":
      case "java":
      case "cpp":
      case "c":
        return <Code className="h-4 w-4 text-blue-500" />
      case "html":
      case "css":
        return <FileText className="h-4 w-4 text-orange-500" />
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
        return <ImageIcon className="h-4 w-4 text-green-500" />
      case "json":
      case "sql":
        return <Database className="h-4 w-4 text-purple-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim(), newFileType)
      setNewFileName("")
      setShowNewFileInput(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  return (
    <div className="h-full bg-gray-50 border-r flex flex-col">
      {/* Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">Explorer</h3>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewFileType("file")
                setShowNewFileInput(true)
              }}
              title="New File"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewFileType("folder")
                setShowNewFileInput(true)
              }}
              title="New Folder"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {/* New File Input */}
        {showNewFileInput && (
          <div className="mb-2 px-2">
            <div className="flex items-center space-x-2 mb-2">
              {newFileType === "file" ? (
                <File className="h-4 w-4 text-gray-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-xs text-gray-500">New {newFileType === "file" ? "File" : "Folder"}</span>
            </div>
            <Input
              placeholder={`Enter ${newFileType} name...`}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile()
                if (e.key === "Escape") {
                  setShowNewFileInput(false)
                  setNewFileName("")
                }
              }}
              className="h-7 text-sm"
              autoFocus
            />
          </div>
        )}

        {/* Root Folder */}
        <div className="space-y-1">
          <div
            className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
            onClick={() => toggleFolder("root")}
          >
            {expandedFolders.has("root") ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
            <span className="text-sm font-medium">Project</span>
          </div>

          {/* Files */}
          {expandedFolders.has("root") && (
            <div className="ml-4 space-y-1">
              {filteredFiles.map((file) => (
                <ContextMenu key={file.id}>
                  <ContextMenuTrigger>
                    <div
                      className={`flex items-center space-x-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 ${
                        currentFile?.id === file.id ? "bg-blue-100 text-blue-700" : ""
                      }`}
                      onClick={() => onFileSelect(file)}
                    >
                      {getFileIcon(file.name, file.type)}
                      <span className="text-sm truncate">{file.name}</span>
                      {file.isModified && <div className="w-2 h-2 bg-orange-500 rounded-full ml-auto" />}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => {
                        const newName = prompt("New name:", file.name)
                        if (newName && newName !== file.name) {
                          onFileRename(file.id, newName)
                        }
                      }}
                    >
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onFileDelete(file.id)} className="text-red-600">
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>

        {filteredFiles.length === 0 && searchTerm && (
          <div className="text-center text-gray-500 text-sm mt-8">No files found matching "{searchTerm}"</div>
        )}

        {files.length === 0 && !searchTerm && (
          <div className="text-center text-gray-500 text-sm mt-8">
            <div className="mb-2">📁</div>
            <p>No files yet</p>
            <p className="text-xs">Create your first file</p>
          </div>
        )}
      </div>
    </div>
  )
}
