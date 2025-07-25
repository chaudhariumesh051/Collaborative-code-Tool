"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface Cursor {
  line: number
  column: number
  endLine?: number
  endColumn?: number
  user: any
  isSelection?: boolean
}

interface Collaborator {
  id: string
  name: string
  avatar: string
  color: string
  isOnline: boolean
  currentFile?: string
  cursor?: Cursor
  lastSeen: Date
}

interface CollaborationContextType {
  collaborators: Collaborator[]
  addCursor: (userId: string, cursor: Cursor) => void
  removeCursor: (userId: string) => void
  updateFileContent: (fileId: string, content: string) => void
  sendMessage: (message: string) => void
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

export function useCollaboration() {
  const context = useContext(CollaborationContext)
  if (!context) {
    throw new Error("useCollaboration must be used within a CollaborationProvider")
  }
  return context
}

interface CollaborationProviderProps {
  children: React.ReactNode
  user: any
}

export function CollaborationProvider({ children, user }: CollaborationProviderProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: "2",
      name: "Jane Smith",
      avatar: "/placeholder.svg?height=32&width=32",
      color: "hsl(120, 70%, 50%)",
      isOnline: true,
      currentFile: "1",
      lastSeen: new Date(),
    },
    {
      id: "3",
      name: "Mike Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
      color: "hsl(300, 70%, 50%)",
      isOnline: true,
      currentFile: "1",
      lastSeen: new Date(),
    },
    {
      id: "4",
      name: "Sarah Wilson",
      avatar: "/placeholder.svg?height=32&width=32",
      color: "hsl(60, 70%, 50%)",
      isOnline: false,
      lastSeen: new Date(Date.now() - 300000),
    },
  ])

  // Simulate real-time collaboration
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate cursor movements
      setCollaborators((prev) =>
        prev.map((collaborator) => {
          if (collaborator.isOnline && Math.random() > 0.7) {
            return {
              ...collaborator,
              cursor: {
                line: Math.floor(Math.random() * 50) + 1,
                column: Math.floor(Math.random() * 80) + 1,
                user: collaborator,
              },
            }
          }
          return collaborator
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const addCursor = (userId: string, cursor: Cursor) => {
    setCollaborators((prev) =>
      prev.map((collaborator) => (collaborator.id === userId ? { ...collaborator, cursor } : collaborator)),
    )
  }

  const removeCursor = (userId: string) => {
    setCollaborators((prev) =>
      prev.map((collaborator) => (collaborator.id === userId ? { ...collaborator, cursor: undefined } : collaborator)),
    )
  }

  const updateFileContent = (fileId: string, content: string) => {
    // In a real implementation, this would send the changes to other collaborators
    // via WebSocket or similar real-time communication
    console.log("Broadcasting file update:", fileId, content.length, "characters")
  }

  const sendMessage = (message: string) => {
    // In a real implementation, this would send the message to other collaborators
    console.log("Broadcasting message:", message)
  }

  return (
    <CollaborationContext.Provider
      value={{
        collaborators: collaborators.filter((c) => c.isOnline),
        addCursor,
        removeCursor,
        updateFileContent,
        sendMessage,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  )
}
