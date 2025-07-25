"use client"

import { ClientOnly } from "@/components/client-only"
import { AuthProviderWrapper, useAuth } from "@/hooks/use-auth"
import { AuthProvider } from "@/components/auth-provider"
import { Dashboard } from "@/components/dashboard"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SetupCheck } from "@/components/setup-check"
import { checkSupabaseConfig } from "@/lib/supabase"
import { useEffect, useState } from "react"

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading CodeCollab...</p>
      </div>
    </div>
  )
}

function HomePage() {
  const { user, loading, initialize } = useAuth()
  const [configCheck, setConfigCheck] = useState<any>(null)

  useEffect(() => {
    // Check Supabase configuration first
    const config = checkSupabaseConfig()
    setConfigCheck(config)

    // Only initialize auth if config is valid
    if (config.isValid) {
      initialize()
    }
  }, [initialize])

  // Show setup check if configuration is invalid
  if (configCheck && !configCheck.isValid) {
    return <SetupCheck />
  }

  if (loading) {
    return <LoadingFallback />
  }

  if (!user) {
    return <AuthProvider />
  }

  return <Dashboard user={user} />
}

export default function Page() {
  return (
    <ClientOnly fallback={<LoadingFallback />}>
      <AuthProviderWrapper>
        <HomePage />
      </AuthProviderWrapper>
    </ClientOnly>
  )
}
