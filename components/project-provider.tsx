"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

interface File {
  id: string
  name: string
  content: string
  language: string
  isModified: boolean
  lastModified: Date
}

interface ProjectContextType {
  files: File[]
  currentFile: File | null
  setCurrentFile: (file: File) => void
  createFile: (name: string) => void
  deleteFile: (id: string) => void
  renameFile: (id: string, newName: string) => void
  updateFileContent: (id: string, content: string) => void
}

const ProjectContext = createContext<ProjectContextType | null>(null)

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}

interface ProjectProviderProps {
  children: React.ReactNode
  user: any
}

export function ProjectProvider({ children, user }: ProjectProviderProps) {
  const [files, setFiles] = useState<File[]>([
    {
      id: "1",
      name: "index.js",
      content: `// Welcome to CodeCollab!
// This is a collaborative code editor

function greetUser(name) {
  console.log(\`Hello, \${name}! Welcome to our collaborative editor.\`);
  
  // You can edit this code in real-time with your team
  const features = [
    'Real-time collaboration',
    'Syntax highlighting',
    'Version control',
    'Live chat',
    'Code comments'
  ];
  
  features.forEach((feature, index) => {
    console.log(\`\${index + 1}. \${feature}\`);
  });
  
  return \`Welcome message sent to \${name}\`;
}

// Try editing this code - your changes will be visible to all collaborators!
greetUser('Developer');

// Add your own functions below:
`,
      language: "javascript",
      isModified: false,
      lastModified: new Date(),
    },
    {
      id: "2",
      name: "styles.css",
      content: `/* Collaborative CSS Editing */

.editor-container {
  display: flex;
  height: 100vh;
  font-family: 'JetBrains Mono', monospace;
}

.sidebar {
  width: 250px;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  padding: 1rem;
}

.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  justify-content: space-between;
}

.code-editor {
  flex: 1;
  background: #1e1e1e;
  color: #d4d4d4;
}

/* Collaborator cursors */
.collaborator-cursor {
  position: absolute;
  width: 2px;
  height: 20px;
  pointer-events: none;
  z-index: 1000;
}

.collaborator-name {
  position: absolute;
  top: -25px;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
}

/* Chat panel */
.chat-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.chat-input {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
}

/* Responsive design */
@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
  }
  
  .sidebar,
  .chat-panel {
    width: 100%;
    height: auto;
  }
}
`,
      language: "css",
      isModified: false,
      lastModified: new Date(),
    },
    {
      id: "3",
      name: "README.md",
      content: `# CodeCollab - Real-time Collaborative Code Editor

Welcome to CodeCollab! This is a powerful, real-time collaborative code editor that allows multiple developers to work together seamlessly.

## Features

### 🚀 Real-time Collaboration
- Multiple users can edit code simultaneously
- See live cursor positions and selections of other users
- Color-coded user indicators
- Real-time synchronization with zero latency

### 💬 Integrated Communication
- Built-in chat system for team communication
- @mention functionality to notify specific team members
- Voice and video call integration (coming soon)
- Threaded discussions per file or project

### 🎨 Advanced Code Editing
- Syntax highlighting for 20+ programming languages
- Auto-indentation and smart formatting
- Real-time linting and error detection
- Multiple themes (dark/light mode)
- VSCode-style shortcuts and features

### 📚 Version Control
- Complete version history with diffs
- Git-like functionality (commit, branch, merge)
- Revert to any previous version
- Activity feed showing all changes

### 🔍 Code Review & Comments
- Inline comments on specific lines
- Suggestion mode with accept/reject functionality
- Threaded discussions
- Code review workflow

### 🏗️ Project Management
- Multi-file project support
- File explorer with drag-and-drop
- Project sharing with access controls
- Private and public workspaces

## Getting Started

1. **Create an Account**: Sign up with email or use OAuth (Google/GitHub)
2. **Create a Project**: Start with a new project or import existing code
3. **Invite Collaborators**: Share your project link with team members
4. **Start Coding**: Begin collaborative editing in real-time!

## Keyboard Shortcuts

- \`Ctrl/Cmd + S\`: Save file
- \`Ctrl/Cmd + /\`: Toggle comment
- \`Ctrl/Cmd + D\`: Duplicate line
- \`Ctrl/Cmd + F\`: Find in file
- \`Ctrl/Cmd + Shift + F\`: Find in project
- \`Ctrl/Cmd + K\`: Command palette

## Supported Languages

- JavaScript/TypeScript
- Python
- Java
- C/C++
- HTML/CSS
- React/Vue/Angular
- Go
- Rust
- PHP
- Ruby
- And many more...

## Architecture

### Frontend
- **React.js** with Next.js
- **Monaco Editor** (VS Code core)
- **Tailwind CSS** for styling
- **WebSocket** for real-time communication

### Backend
- **Node.js** with Express
- **MongoDB** for data storage
- **Redis** for session management
- **Socket.IO** for real-time sync

### Real-time Engine
- **Operational Transformation (OT)** for conflict resolution
- **WebRTC** for peer-to-peer communication
- **CRDT** support for distributed editing

## Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## License

MIT License - see LICENSE file for details.

---

Happy coding! 🎉
`,
      language: "markdown",
      isModified: false,
      lastModified: new Date(),
    },
  ])

  const [currentFile, setCurrentFile] = useState<File | null>(files[0] || null)

  const createFile = (name: string) => {
    const newFile: File = {
      id: Date.now().toString(),
      name,
      content: "",
      language: getLanguageFromExtension(name),
      isModified: false,
      lastModified: new Date(),
    }
    setFiles((prev) => [...prev, newFile])
    setCurrentFile(newFile)
  }

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    if (currentFile?.id === id) {
      setCurrentFile(files.find((f) => f.id !== id) || null)
    }
  }

  const renameFile = (id: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName, language: getLanguageFromExtension(newName) } : f)),
    )
  }

  const updateFileContent = (id: string, content: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content, isModified: true, lastModified: new Date() } : f)),
    )
  }

  const getLanguageFromExtension = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      sql: "sql",
      php: "php",
      go: "go",
      rs: "rust",
      rb: "ruby",
    }
    return languageMap[ext || ""] || "plaintext"
  }

  return (
    <ProjectContext.Provider
      value={{
        files,
        currentFile,
        setCurrentFile,
        createFile,
        deleteFile,
        renameFile,
        updateFileContent,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}
