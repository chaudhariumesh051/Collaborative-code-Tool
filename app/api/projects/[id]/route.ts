import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get project with collaborators
    const { data: project, error } = await supabase
      .from("projects")
      .select(`
        *,
        owner:users!projects_owner_id_fkey(id, name, email),
        collaborators:project_collaborators(
          user:users(id, name, email)
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user has access
    const hasAccess =
      project.owner_id === decoded.userId ||
      project.collaborators.some((collab: any) => collab.user.id === decoded.userId)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { name, description, fileStructure } = await request.json()

    // Check if user owns the project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.owner_id !== decoded.userId) {
      return NextResponse.json({ error: "Only project owner can update project" }, { status: 403 })
    }

    // Update project
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (fileStructure) updateData.file_structure = fileStructure

    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Database error:", updateError)
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
    }

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Check if user owns the project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.owner_id !== decoded.userId) {
      return NextResponse.json({ error: "Only project owner can delete project" }, { status: 403 })
    }

    // Delete project (cascades to collaborators)
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", params.id)

    if (deleteError) {
      console.error("Database error:", deleteError)
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
    }

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
