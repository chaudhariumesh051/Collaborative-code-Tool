"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, Check } from "lucide-react"
import { checkSupabaseConfig } from "@/lib/supabase"

export function SetupCheck() {
  const [config, setConfig] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setConfig(checkSupabaseConfig())
  }, [])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (!config) {
    return null
  }

  if (config.isValid) {
    return null // Don't show if everything is configured
  }

  const exampleEnv = `# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000`

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <XCircle className="h-6 w-6 mr-2" />
            Supabase Configuration Required
          </CardTitle>
          <CardDescription>
            CodeCollab requires Supabase configuration to function properly. Please set up your environment variables.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Configuration Status */}
          <div className="space-y-3">
            <h3 className="font-medium">Configuration Status:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {config.config.url ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
              </div>
              <div className="flex items-center space-x-2">
                {config.config.anonKey ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              </div>
              <div className="flex items-center space-x-2">
                {config.config.serviceRoleKey ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm">SUPABASE_SERVICE_ROLE_KEY (Optional)</span>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Required:</strong> Please follow these steps to configure Supabase:
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Step 1: Create a Supabase Project</h4>
              <p className="text-sm text-gray-600">
                If you don't have a Supabase project yet, create one at{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  supabase.com/dashboard
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Step 2: Get Your API Keys</h4>
              <p className="text-sm text-gray-600">
                In your Supabase dashboard, go to <strong>Settings → API</strong> and copy:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside ml-4">
                <li>Project URL</li>
                <li>anon/public key</li>
                <li>service_role key (optional, for admin features)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Step 3: Create Environment File</h4>
              <p className="text-sm text-gray-600">
                Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root with:
              </p>
              <div className="relative">
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                  <code>{exampleEnv}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 bg-transparent"
                  onClick={() => copyToClipboard(exampleEnv)}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Step 4: Set Up Database Schema</h4>
              <p className="text-sm text-gray-600">
                Run the SQL schema in your Supabase SQL editor to create the necessary tables and security policies.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://supabase.com/dashboard/project/_/sql", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase SQL Editor
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Step 5: Restart Development Server</h4>
              <p className="text-sm text-gray-600">
                After creating the <code className="bg-gray-100 px-1 rounded">.env.local</code> file, restart your
                development server:
              </p>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                <code>npm run dev</code>
              </pre>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Need Help?</strong> Check out the{" "}
              <a
                href="https://supabase.com/docs/guides/getting-started/quickstarts/nextjs"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Supabase Next.js Quick Start Guide
              </a>{" "}
              for detailed setup instructions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
