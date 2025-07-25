"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, UserPlus } from "lucide-react"
import { useProject } from "@/hooks/use-project"

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: any
  currentUser: any
}

export function InviteDialog({ open, onOpenChange, project, currentUser }: InviteDialogProps) {
  const { inviteCollaborator } = useProject()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const projectUrl = `${window.location.origin}/project/${project.id}`

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const result = await inviteCollaborator(project.id, email)

    if (result.success) {
      setMessage(result.message)
      setEmail("")
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const isOwner = project.owner_id === currentUser.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>Invite collaborators to work on "{project.name}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Collaborators */}
          <div>
            <h4 className="text-sm font-medium mb-3">Current Collaborators</h4>
            <div className="space-y-2">
              {/* Owner */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.owner?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{project.owner?.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {project.owner?.full_name || "Unknown"}
                      {project.owner_id === currentUser.id && " (You)"}
                    </div>
                    <div className="text-xs text-gray-500">{project.owner?.email}</div>
                  </div>
                </div>
                <Badge variant="secondary">Owner</Badge>
              </div>

              {/* Collaborators */}
              {project.collaborators?.map((collab: any) => (
                <div key={collab.user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={collab.user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{collab.user.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {collab.user.full_name}
                        {collab.user.id === currentUser.id && " (You)"}
                      </div>
                      <div className="text-xs text-gray-500">{collab.user.email}</div>
                    </div>
                  </div>
                  <Badge variant="outline">Collaborator</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Invite by Email */}
          {isOwner && (
            <div>
              <h4 className="text-sm font-medium mb-3">Invite by Email</h4>

              {message && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <Check className="h-4 w-4" />
                  <AlertDescription className="text-green-800">{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleInvite} className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Share Link */}
          <div>
            <h4 className="text-sm font-medium mb-3">Share Link</h4>
            <div className="flex space-x-2">
              <Input value={projectUrl} readOnly className="font-mono text-sm" />
              <Button type="button" variant="outline" onClick={handleCopyLink} className="shrink-0 bg-transparent">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {isOwner
                ? "Anyone with this link can view the project. Only invited users can edit."
                : "Share this link to let others view the project."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
