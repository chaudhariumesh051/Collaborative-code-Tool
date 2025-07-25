-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'github', 'discord', 'apple');
CREATE TYPE project_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User authentication providers
CREATE TABLE public.user_auth_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    provider auth_provider NOT NULL,
    provider_id TEXT NOT NULL,
    provider_username TEXT,
    provider_email TEXT,
    provider_data JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider, provider_id),
    UNIQUE(user_id, provider)
);

-- User sessions (for tracking active sessions)
CREATE TABLE public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE public.password_reset_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens
CREATE TABLE public.email_verification_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Two-factor authentication
CREATE TABLE public.user_mfa (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    method TEXT NOT NULL, -- 'totp', 'sms', 'email'
    secret TEXT, -- For TOTP
    phone_number TEXT, -- For SMS
    backup_codes TEXT[], -- Backup recovery codes
    is_enabled BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table with enhanced permissions
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_structure JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    template_category TEXT,
    tags TEXT[] DEFAULT '{}',
    language TEXT DEFAULT 'javascript',
    framework TEXT,
    license TEXT DEFAULT 'MIT',
    repository_url TEXT,
    demo_url TEXT,
    stars_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project collaborators with detailed permissions
CREATE TABLE public.project_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role project_role DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}', -- Custom permissions
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(project_id, user_id)
);

-- Project invitations
CREATE TABLE public.project_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role project_role DEFAULT 'viewer',
    token TEXT UNIQUE NOT NULL,
    status invitation_status DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User API keys for programmatic access
CREATE TABLE public.user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT UNIQUE NOT NULL,
    key_prefix TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for security tracking
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE public.rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP, user_id, etc.
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, action, window_start)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_last_seen ON public.users(last_seen);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_is_public ON public.projects(is_public);
CREATE INDEX idx_projects_tags ON public.projects USING GIN(tags);
CREATE INDEX idx_projects_last_activity ON public.projects(last_activity);

CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX idx_project_collaborators_role ON public.project_collaborators(role);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_auth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by authenticated users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for user_auth_providers
CREATE POLICY "Users can view their own auth providers" ON public.user_auth_providers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own auth providers" ON public.user_auth_providers
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Public projects are viewable by everyone" ON public.projects
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view projects they own or collaborate on" ON public.projects
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = id AND is_active = true
        )
    );

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update their projects" ON public.projects
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Project owners and admins can delete projects" ON public.projects
    FOR DELETE USING (
        auth.uid() = owner_id OR
        auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = id AND role = 'admin' AND is_active = true
        )
    );

-- RLS Policies for project_collaborators
CREATE POLICY "Users can view collaborators of accessible projects" ON public.project_collaborators
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE owner_id = auth.uid() OR is_public = true OR
            id IN (
                SELECT project_id FROM public.project_collaborators 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY "Project owners and admins can manage collaborators" ON public.project_collaborators
    FOR ALL USING (
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
        ) OR
        (auth.uid() IN (
            SELECT user_id FROM public.project_collaborators 
            WHERE project_id = project_collaborators.project_id 
            AND role = 'admin' AND is_active = true
        ))
    );

-- Functions for user management
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    username_base TEXT;
    username_final TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate username from email
    username_base := split_part(NEW.email, '@', 1);
    username_base := regexp_replace(username_base, '[^a-zA-Z0-9]', '', 'g');
    username_final := username_base;
    
    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = username_final) LOOP
        counter := counter + 1;
        username_final := username_base || counter::TEXT;
    END LOOP;

    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        username,
        avatar_url,
        is_verified
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        username_final,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.email_confirmed_at IS NOT NULL
    );
    
    -- Log user creation
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (NEW.id, 'user_created', 'user', NEW.id, jsonb_build_object(
        'email', NEW.email,
        'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
    ));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user last seen
CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET last_seen = NOW() 
    WHERE id = auth.uid();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate API key
CREATE OR REPLACE FUNCTION public.generate_api_key(key_name TEXT)
RETURNS TEXT AS $$
DECLARE
    api_key TEXT;
    key_prefix TEXT;
    key_hash TEXT;
BEGIN
    -- Generate random API key
    api_key := 'ck_' || encode(gen_random_bytes(32), 'base64');
    api_key := replace(replace(api_key, '+', ''), '/', '');
    api_key := substr(api_key, 1, 48);
    
    key_prefix := substr(api_key, 1, 12);
    key_hash := encode(digest(api_key, 'sha256'), 'hex');
    
    INSERT INTO public.user_api_keys (user_id, name, key_hash, key_prefix)
    VALUES (auth.uid(), key_name, key_hash, key_prefix);
    
    RETURN api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM public.password_reset_tokens WHERE expires_at < NOW();
    DELETE FROM public.email_verification_tokens WHERE expires_at < NOW();
    DELETE FROM public.project_invitations WHERE expires_at < NOW() AND status = 'pending';
    DELETE FROM public.user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create a scheduled job to cleanup expired tokens (if pg_cron is available)
-- SELECT cron.schedule('cleanup-expired-tokens', '0 2 * * *', 'SELECT public.cleanup_expired_tokens();');
