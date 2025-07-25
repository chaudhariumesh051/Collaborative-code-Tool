// Email service implementation
// You can use services like SendGrid, Nodemailer, or Resend

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`

  // Mock implementation - replace with actual email service
  console.log(`
    Verification email for ${name} (${email}):
    Click here to verify: ${verificationUrl}
  `)

  // Example with a real email service:
  /*
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: 'Verify your CodeCollab account',
    html: `
      <h1>Welcome to CodeCollab, ${name}!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `,
  }
  
  await sgMail.send(msg)
  */
}

export async function sendInviteEmail(
  email: string,
  inviterName: string,
  projectName: string,
  projectId: string,
  type: "register" | "collaborate",
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const inviteUrl =
    type === "register" ? `${baseUrl}/?invite=${projectId}&email=${email}` : `${baseUrl}/project/${projectId}`

  // Mock implementation - replace with actual email service
  console.log(`
    Invite email for ${email}:
    ${inviterName} invited you to collaborate on "${projectName}"
    ${type === "register" ? "Register and join:" : "Join project:"} ${inviteUrl}
  `)
}
