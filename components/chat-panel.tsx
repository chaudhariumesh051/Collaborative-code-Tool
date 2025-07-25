"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Smile, Paperclip, Phone, Video, MoreVertical } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ChatPanelProps {
  currentUser: any
  collaborators: any[]
  projectId: string
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender?: any
  message_type: string
  mentions: string[]
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

export function ChatPanel({ currentUser, collaborators, projectId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load initial messages
    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          *,
          sender:users(id, full_name, email, avatar_url)
        `,
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error

      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      const mentions = newMessage.match(/@(\w+)/g)?.map((m) => m.substring(1)) || []

      const { error } = await supabase.from("chat_messages").insert({
        project_id: projectId,
        sender_id: currentUser.id,
        content: newMessage,
        message_type: mentions.length > 0 ? "mention" : "text",
        mentions,
      })

      if (error) throw error

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (content: string) => {
    // Replace @mentions with styled spans
    return content.replace(/@(\w+)/g, '<span class="bg-blue-100 text-blue-700 px-1 rounded">@$1</span>')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Team Chat</h3>
            <p className="text-xs text-gray-500">{collaborators.length + 1} members online</p>
          </div>
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost">
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Video className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.sender?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{message.sender?.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{message.sender?.full_name || "Unknown"}</span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(new Date(message.created_at))}</span>
                  {message.message_type === "mention" && (
                    <Badge variant="outline" className="text-xs">
                      mention
                    </Badge>
                  )}
                </div>
                <div
                  className="text-sm text-gray-700 mt-1"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
              </div>
            </div>
          ))}

          {/* Typing Indicators */}
          {isTyping.map((userId) => {
            const user = collaborators.find((c) => c.id === userId)
            return user ? (
              <div key={userId} className="flex items-center space-x-2 text-sm text-gray-500">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{user.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span>{user.full_name} is typing...</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            ) : null
          })}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type a message... (@mention someone)"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Smile className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</div>
      </div>
    </div>
  )
}
