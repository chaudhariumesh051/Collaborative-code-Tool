import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import archiver from "archiver"

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

    // Get project
    const { data: project, error } = await supabase
      .from("projects")
      .select(`
        *,
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

    // Create zip archive
    const archive = archiver("zip", {
      zlib: { level: 9 },
    })

    // Add files to archive
    const addFilesToArchive = (files: any[], basePath = "") => {
      files.forEach((file) => {
        if (file.type === "file") {
          const filePath = basePath ? `${basePath}/${file.name}` : file.name
          archive.append(file.content || "", { name: filePath })
        } else if (file.type === "folder" && file.children) {
          const folderPath = basePath ? `${basePath}/${file.name}` : file.name
          addFilesToArchive(file.children, folderPath)
        }
      })
    }

    addFilesToArchive(project.file_structure || [])

    // Add project info
    const projectInfo = `# ${project.name}

Description: ${project.description || "No description"}
Created: ${new Date(project.created_at).toLocaleString()}
Owner: ${project.owner?.name || "Unknown"}

## Collaborators
${project.collaborators.map((c: any) => `- ${c.user.name} (${c.user.email})`).join("\n")}

---
Exported from CodeCollab - Real-time Collaborative Code Editor
`

    archive.append(projectInfo, { name: "PROJECT_INFO.md" })

    // Finalize archive
    archive.finalize()

    // Convert archive to buffer
    const chunks: Buffer[] = []
    archive.on("data", (chunk) => chunks.push(chunk))

    return new Promise((resolve) => {
      archive.on("end", () => {
        const buffer = Buffer.concat(chunks)

        const response = new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}.zip"`,
            "Content-Length": buffer.length.toString(),
          },
        })

        resolve(response)
      })
    })
  } catch (error) {
    console.error("Export project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
