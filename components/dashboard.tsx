"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Code2,
  Users,
  Calendar,
  MoreVertical,
  Trash2,
  ExternalLink,
  LogOut,
  User,
  Settings,
  FolderOpen,
} from "lucide-react"
import { useProjects } from "@/hooks/use-projects"
import { useAuth } from "@/hooks/use-auth"

interface DashboardProps {
  user: any
}

export function Dashboard({ user }: DashboardProps) {
  const router = useRouter()
  const { signOut } = useAuth()
  const { projects, loading, loadProjects, createProject, deleteProject } = useProjects()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")

    const result = await createProject(projectName, projectDescription)

    if (result.success) {
      setShowCreateDialog(false)
      setProjectName("")
      setProjectDescription("")
      router.push(`/project/${result.project.id}`)
    } else {
      setError(result.error)
    }

    setCreating(false)
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
      await deleteProject(projectId)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  const ownedProjects = projects.filter((p) => p.owner_id === user.id)
  const collaboratedProjects = projects.filter((p) => p.owner_id !== user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Code2 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold">CodeCollab</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>Start a new collaborative coding project</DialogDescription>
                  </DialogHeader>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Project name"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Project description (optional)"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name} />
                      <AvatarFallback>{user.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.full_name}!</h2>
          <p className="text-gray-600">Manage your collaborative coding projects</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Owned Projects */}
            {ownedProjects.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Your Projects ({ownedProjects.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                              {project.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {project.description || "No description"}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/project/${project.id}`)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent onClick={() => router.push(`/project/${project.id}`)}>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatTimeAgo(project.created_at)}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {(project.collaborators?.length || 0) + 1}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Owner</Badge>
                          {project.collaborators && project.collaborators.length > 0 && (
                            <div className="flex -space-x-2">
                              {project.collaborators.slice(0, 3).map((collab: any) => (
                                <Avatar key={collab.user.id} className="h-6 w-6 border-2 border-white">
                                  <AvatarImage src={collab.user.avatar_url || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">
                                    {collab.user.full_name?.charAt(0).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {project.collaborators.length > 3 && (
                                <div className="h-6 w-6 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium">+{project.collaborators.length - 3}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Collaborated Projects */}
            {collaboratedProjects.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Shared with You ({collaboratedProjects.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {collaboratedProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </CardTitle>
                        <CardDescription>{project.description || "No description"}</CardDescription>
                      </CardHeader>
                      <CardContent onClick={() => router.push(`/project/${project.id}`)}>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatTimeAgo(project.updated_at)}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {(project.collaborators?.length || 0) + 1}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Collaborator</Badge>
                          <div className="text-sm text-gray-500">by {project.owner?.full_name}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {projects.length === 0 && (
              <div className="text-center py-12">
                <Code2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-500 mb-6">Create your first project to start collaborating with your team</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
