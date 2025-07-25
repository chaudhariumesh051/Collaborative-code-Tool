const { Server } = require("socket.io")
const { createServer } = require("http")
const jwt = require("jsonwebtoken")

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Store active projects and their collaborators
const activeProjects = new Map()
const userSockets = new Map()

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) {
    return next(new Error("Authentication error"))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.userId = decoded.userId
    socket.userEmail = decoded.email
    next()
  } catch (err) {
    next(new Error("Authentication error"))
  }
})

io.on("connection", (socket) => {
  console.log(`User ${socket.userId} connected`)

  // Store user socket
  userSockets.set(socket.userId, socket)

  // Join project room
  socket.on("join-project", (projectId) => {
    socket.join(projectId)
    socket.projectId = projectId

    // Initialize project if not exists
    if (!activeProjects.has(projectId)) {
      activeProjects.set(projectId, {
        collaborators: new Map(),
        files: new Map(),
        cursors: new Map(),
      })
    }

    const project = activeProjects.get(projectId)

    // Add user to project collaborators
    project.collaborators.set(socket.userId, {
      id: socket.userId,
      email: socket.userEmail,
      socketId: socket.id,
      joinedAt: new Date(),
      currentFile: null,
      cursor: null,
    })

    // Notify other users in the project
    socket.to(projectId).emit("user-joined", {
      userId: socket.userId,
      email: socket.userEmail,
    })

    // Send current collaborators to the new user
    const collaborators = Array.from(project.collaborators.values())
    socket.emit("collaborators-updated", collaborators)
  })

  // Handle file updates
  socket.on("file-update", (data) => {
    const { fileId, content, cursor } = data
    const projectId = socket.projectId

    if (!projectId) return

    const project = activeProjects.get(projectId)
    if (!project) return

    // Update file content
    project.files.set(fileId, {
      id: fileId,
      content,
      lastModified: new Date(),
      modifiedBy: socket.userId,
    })

    // Broadcast to other users in the project
    socket.to(projectId).emit("file-updated", {
      fileId,
      content,
      userId: socket.userId,
      timestamp: new Date(),
    })

    // Update user's current file
    const collaborator = project.collaborators.get(socket.userId)
    if (collaborator) {
      collaborator.currentFile = fileId
      collaborator.lastActivity = new Date()
    }
  })

  // Handle cursor updates
  socket.on("cursor-update", (data) => {
    const { fileId, line, column, selection } = data
    const projectId = socket.projectId

    if (!projectId) return

    const project = activeProjects.get(projectId)
    if (!project) return

    // Update cursor position
    project.cursors.set(socket.userId, {
      userId: socket.userId,
      fileId,
      line,
      column,
      selection,
      timestamp: new Date(),
    })

    // Broadcast cursor position to other users
    socket.to(projectId).emit("cursor-updated", {
      userId: socket.userId,
      fileId,
      line,
      column,
      selection,
    })
  })

  // Handle file creation
  socket.on("file-created", (fileData) => {
    const projectId = socket.projectId
    if (!projectId) return

    socket.to(projectId).emit("file-created", {
      ...fileData,
      createdBy: socket.userId,
      timestamp: new Date(),
    })
  })

  // Handle file deletion
  socket.on("file-deleted", (data) => {
    const projectId = socket.projectId
    if (!projectId) return

    socket.to(projectId).emit("file-deleted", {
      ...data,
      deletedBy: socket.userId,
      timestamp: new Date(),
    })
  })

  // Handle file rename
  socket.on("file-renamed", (data) => {
    const projectId = socket.projectId
    if (!projectId) return

    socket.to(projectId).emit("file-renamed", {
      ...data,
      renamedBy: socket.userId,
      timestamp: new Date(),
    })
  })

  // Handle chat messages
  socket.on("chat-message", (data) => {
    const projectId = socket.projectId
    if (!projectId) return

    const message = {
      id: Date.now().toString(),
      content: data.content,
      senderId: socket.userId,
      senderEmail: socket.userEmail,
      timestamp: new Date(),
      mentions: data.mentions || [],
    }

    // Broadcast message to all users in the project
    io.to(projectId).emit("chat-message", message)
  })

  // Handle typing indicators
  socket.on("typing-start", () => {
    const projectId = socket.projectId
    if (!projectId) return

    socket.to(projectId).emit("user-typing", {
      userId: socket.userId,
      email: socket.userEmail,
    })
  })

  socket.on("typing-stop", () => {
    const projectId = socket.projectId
    if (!projectId) return

    socket.to(projectId).emit("user-stopped-typing", {
      userId: socket.userId,
    })
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`)

    const projectId = socket.projectId
    if (projectId && activeProjects.has(projectId)) {
      const project = activeProjects.get(projectId)

      // Remove user from project
      project.collaborators.delete(socket.userId)
      project.cursors.delete(socket.userId)

      // Notify other users
      socket.to(projectId).emit("user-left", {
        userId: socket.userId,
      })

      // Clean up empty projects
      if (project.collaborators.size === 0) {
        activeProjects.delete(projectId)
      }
    }

    // Remove user socket
    userSockets.delete(socket.userId)
  })
})

const PORT = process.env.SOCKET_PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})
