import { createClient } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

// Create the main Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    headers: {
      "X-Client-Info": "codecollab-web",
    },
  },
})

// Admin client for server-side operations (only if service role key is available)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Database types
export interface User {
  id: string
  email: string
  full_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  website?: string
  location?: string
  role: "user" | "admin" | "moderator"
  is_verified: boolean
  is_active: boolean
  last_seen?: string
  preferences: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UserAuthProvider {
  id: string
  user_id: string
  provider: "email" | "google" | "github" | "discord" | "apple"
  provider_id: string
  provider_username?: string
  provider_email?: string
  provider_data: Record<string, any>
  is_primary: boolean
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  slug?: string
  owner_id: string
  file_structure: any[]
  settings: Record<string, any>
  is_public: boolean
  is_template: boolean
  template_category?: string
  tags: string[]
  language: string
  framework?: string
  license: string
  repository_url?: string
  demo_url?: string
  stars_count: number
  forks_count: number
  views_count: number
  last_activity: string
  created_at: string
  updated_at: string
  owner?: User
  collaborators?: ProjectCollaborator[]
}

export interface ProjectCollaborator {
  id: string
  project_id: string
  user_id: string
  role: "owner" | "admin" | "editor" | "viewer"
  permissions: Record<string, any>
  invited_by?: string
  invited_at: string
  joined_at?: string
  last_accessed?: string
  is_active: boolean
  user?: User
}

export interface ProjectInvitation {
  id: string
  project_id: string
  inviter_id: string
  email: string
  role: "owner" | "admin" | "editor" | "viewer"
  token: string
  status: "pending" | "accepted" | "declined" | "expired"
  message?: string
  expires_at: string
  responded_at?: string
  created_at: string
  project?: Project
  inviter?: User
}

export interface UserApiKey {
  id: string
  user_id: string
  name: string
  key_prefix: string
  permissions: Record<string, any>
  last_used?: string
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: User
}

// Auth helper functions
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error getting current session:", error)
    return null
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error("Error signing out:", error)
    return { error }
  }
}

// OAuth providers configuration
export const oAuthProviders = {
  google: {
    name: "Google",
    icon: "🔍",
  },
  github: {
    name: "GitHub",
    icon: "🐙",
  },
  discord: {
    name: "Discord",
    icon: "🎮",
  },
} as const

export type OAuthProvider = keyof typeof oAuthProviders

// Environment check helper
export const checkSupabaseConfig = () => {
  const config = {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey,
    serviceRoleKey: !!supabaseServiceRoleKey,
  }

  return {
    isValid: config.url && config.anonKey,
    config,
    missing: Object.entries(config)
      .filter(([_, value]) => !value)
      .map(([key]) => key),
  }
}
