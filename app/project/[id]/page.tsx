"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ClientOnly } from "@/components/client-only"
import { EditorLayout } from "@/components/editor-layout"
import { AuthProviderWrapper, useAuth } from "@/hooks/use-auth"
import { useProject } from "@/hooks/use-project"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading project...</p>
      </div>
    </div>
  )
}

function ProjectPageContent() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading: authLoading, initialize } = useAuth()
  const { project, loading: projectLoading, error, loadProject } = useProject()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user && id) {
      loadProject(id as string)
    }
  }, [user, id, loadProject])

  if (authLoading || projectLoading) {
    return <LoadingFallback />
  }

  if (!user) {
    router.push("/")
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>Error Loading Project:</strong> {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Project Not Found</h1>
          <p className="text-gray-500 mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return <EditorLayout user={user} project={project} />
}

export default function ProjectPage() {
  return (
    <ClientOnly fallback={<LoadingFallback />}>
      <AuthProviderWrapper>
        <ProjectPageContent />
      </AuthProviderWrapper>
    </ClientOnly>
  )
}
