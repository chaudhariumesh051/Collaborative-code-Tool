import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user's projects (owned and collaborated)
    const { data: projects, error } = await supabase
      .from("projects")
      .select(`
        *,
        owner:users!projects_owner_id_fkey(id, name, email),
        collaborators:project_collaborators(
          user:users(id, name, email)
        )
      `)
      .or(`owner_id.eq.${decoded.userId},project_collaborators.user_id.eq.${decoded.userId}`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }

    return NextResponse.json({ projects: projects || [] })
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 })
    }

    // Create default file structure
    const defaultFiles = [
      {
        name: "index.js",
        content: `// Welcome to ${name}!
console.log("Hello, World!");

function main() {
  // Start coding here
  console.log("Project: ${name}");
}

main();
`,
        type: "file",
        language: "javascript",
      },
      {
        name: "README.md",
        content: `# ${name}

${description || "A collaborative coding project"}

## Getting Started

This project was created with CodeCollab - a real-time collaborative code editor.

## Features

- Real-time collaboration
- Syntax highlighting
- Version control
- Live chat
- Code comments

Happy coding! 🚀
`,
        type: "file",
        language: "markdown",
      },
    ]

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name,
        description: description || "",
        owner_id: decoded.userId,
        file_structure: defaultFiles,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (projectError) {
      console.error("Database error:", projectError)
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
