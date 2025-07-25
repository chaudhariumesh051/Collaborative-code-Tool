# CodeCollab Setup Guide

## Quick Start

### 1. Create Supabase Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and fill in project details
4. Wait for the project to be created

### 2. Get API Keys
1. In your Supabase dashboard, go to **Settings → API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role key** (optional, for admin features)

### 3. Configure Environment Variables
1. Create a `.env.local` file in your project root
2. Add your Supabase credentials:

\`\`\`env
# REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OPTIONAL (for admin features)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Set Up Database Schema
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/complete-auth-schema.sql`
4. Click "Run" to execute the SQL

### 5. Configure OAuth (Optional)
If you want to enable OAuth login:

1. In Supabase dashboard, go to **Authentication → Providers**
2. Enable the providers you want (Google, GitHub, Discord)
3. Add the redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

### 6. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

## Troubleshooting

### "supabaseKey is required" Error
- Make sure you've created the `.env.local` file
- Verify your environment variables are correctly named
- Restart your development server after adding environment variables

### Authentication Not Working
- Check that your Supabase project URL and keys are correct
- Ensure the database schema has been set up
- Verify RLS policies are enabled

### OAuth Issues
- Make sure redirect URLs are configured in Supabase
- Check that OAuth providers are enabled in your Supabase project
- Verify client IDs and secrets are correct

## Production Deployment

When deploying to production:

1. Set all environment variables in your hosting platform
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Add your production domain to Supabase's allowed origins
4. Configure OAuth redirect URLs for production

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
