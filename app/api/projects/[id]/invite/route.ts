import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { sendInviteEmail } from "@/lib/email"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if user owns the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, owner:users!projects_owner_id_fkey(name, email)")
      .eq("id", params.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.owner_id !== decoded.userId) {
      return NextResponse.json({ error: "Only project owner can invite collaborators" }, { status: 403 })
    }

    // Check if user exists
    const { data: invitedUser, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", email)
      .single()

    if (userError && userError.code !== "PGRST116") {
      console.error("Database error:", userError)
      return NextResponse.json({ error: "Failed to check user" }, { status: 500 })
    }

    if (!invitedUser) {
      // User doesn't exist, send registration invite
      await sendInviteEmail(email, project.owner.name, project.name, params.id, "register")
      return NextResponse.json({
        message: "Invitation sent! The user will need to register first.",
      })
    }

    // Check if user is already a collaborator
    const { data: existingCollaborator } = await supabase
      .from("project_collaborators")
      .select("id")
      .eq("project_id", params.id)
      .eq("user_id", invitedUser.id)
      .single()

    if (existingCollaborator) {
      return NextResponse.json({ error: "User is already a collaborator" }, { status: 400 })
    }

    // Add collaborator
    const { error: collaboratorError } = await supabase.from("project_collaborators").insert({
      project_id: params.id,
      user_id: invitedUser.id,
      invited_by: decoded.userId,
      invited_at: new Date().toISOString(),
    })

    if (collaboratorError) {
      console.error("Database error:", collaboratorError)
      return NextResponse.json({ error: "Failed to add collaborator" }, { status: 500 })
    }

    // Send notification email
    await sendInviteEmail(email, project.owner.name, project.name, params.id, "collaborate")

    return NextResponse.json({
      message: "Collaborator added successfully!",
      collaborator: {
        id: invitedUser.id,
        name: invitedUser.name,
        email: invitedUser.email,
      },
    })
  } catch (error) {
    console.error("Invite collaborator error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
