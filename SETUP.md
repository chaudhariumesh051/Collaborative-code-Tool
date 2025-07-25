# CodeCollab Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Git (optional)

## Quick Setup

### 1. Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`

2. Fill in your Supabase credentials in `.env.local`:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings > API
   - Copy the Project URL and anon/public key

3. Generate a JWT secret:
   \`\`\`bash
   # On macOS/Linux:
   openssl rand -base64 32
   
   # Or use any secure random string generator
   \`\`\`

### 2. Database Setup

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `scripts/supabase-schema.sql`
3. Run the SQL to create all necessary tables and policies

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see your collaborative code editor!

## Environment Variables Explained

### Required Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
- `JWT_SECRET`: A secure random string for JWT token signing
- `NEXT_PUBLIC_APP_URL`: Your app's URL (for redirects and links)

### Optional Variables

- `SUPABASE_SERVICE_ROLE_KEY`: For admin operations (project deletion, etc.)
- `FROM_EMAIL`: Email address for sending notifications
- `SMTP_*`: Email server configuration for sending invites/notifications
- `NEXT_PUBLIC_SOCKET_URL`: WebSocket server URL for real-time features
- `SOCKET_PORT`: Port for the WebSocket server

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add all environment variables in Vercel's dashboard
4. Deploy!

### Other Platforms

Make sure to set all required environment variables in your deployment platform's settings.

## Troubleshooting

### Common Issues

1. **"User profile not found"**: Make sure the database schema is properly set up with triggers
2. **Authentication errors**: Verify your Supabase keys are correct
3. **CORS errors**: Ensure your domain is added to Supabase's allowed origins

### Getting Help

- Check the browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure your Supabase project has the correct schema and RLS policies
