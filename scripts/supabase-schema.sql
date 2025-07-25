-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_structure JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project collaborators table
CREATE TABLE public.project_collaborators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'admin')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Chat messages table
CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'mention', 'system')),
    mentions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    line_number INTEGER,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project versions table (for version history)
CREATE TABLE public.project_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    file_structure JSONB NOT NULL,
    changes JSONB,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message TEXT
);

-- Indexes for better performance
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at);
CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX idx_chat_messages_project_id ON public.chat_messages(project_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_comments_project_id ON public.comments(project_id);
CREATE INDEX idx_comments_file_path ON public.comments(file_path);
CREATE INDEX idx_project_versions_project_id ON public.project_versions(project_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view projects they own or collaborate on" ON public.projects
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        id IN (
            SELECT project_id FROM public.project_collaborators 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can update projects" ON public.projects
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects" ON public.projects
    FOR DELETE USING (owner_id = auth.uid());

-- Collaborators policies
CREATE POLICY "Users can view collaborators of accessible projects" ON public.project_collaborators
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage collaborators" ON public.project_collaborators
    FOR ALL USING (
        project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
    );

-- Chat messages policies
CREATE POLICY "Users can view chat messages on accessible projects" ON public.chat_messages
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send chat messages on accessible projects" ON public.chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        )
    );

-- Comments policies
CREATE POLICY "Users can view comments on accessible projects" ON public.comments
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments on accessible projects" ON public.comments
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        )
    );

-- Project versions policies
CREATE POLICY "Users can view versions of accessible projects" ON public.project_versions
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create versions for accessible projects" ON public.project_versions
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        project_id IN (
            SELECT id FROM public.projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_collaborators WHERE user_id = auth.uid()
        )
    );

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
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

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
