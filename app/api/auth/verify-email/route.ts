import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Update user email verification status
    const { error } = await supabase.from("users").update({ email_verified: true }).eq("id", decoded.userId)

    if (error) {
      return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
    }

    return NextResponse.json({ message: "Email verified successfully" })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
  }
}
