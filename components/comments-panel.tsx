"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, Check, Reply } from "lucide-react"

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}

interface CommentsPanelProps {
  currentFile: any
  currentUser: any
}

interface Comment {
  id: string
  lineNumber: number
  author: any
  content: string
  timestamp: Date
  resolved: boolean
  replies: any[]
  type: "comment" | "suggestion"
  suggestion?: {
    original: string
    proposed: string
  }
}

export function CommentsPanel({ currentFile, currentUser }: CommentsPanelProps) {
  const [comments, setComments] = useState([
    {
      id: "1",
      lineNumber: 15,
      author: { name: "Jane Smith", avatar: "/placeholder.svg?height=32&width=32", color: "hsl(120, 70%, 50%)" },
      content: "This function could be optimized by using memoization",
      timestamp: new Date(Date.now() - 300000),
      resolved: false,
      replies: [
        {
          id: "1-1",
          author: { name: "John Doe", avatar: "/placeholder.svg?height=32&width=32", color: "hsl(210, 70%, 50%)" },
          content: "Good point! I'll implement useMemo here.",
          timestamp: new Date(Date.now() - 240000),
        },
      ],
      type: "comment",
    },
    {
      id: "2",
      lineNumber: 42,
      author: { name: "Mike Johnson", avatar: "/placeholder.svg?height=32&width=32", color: "hsl(300, 70%, 50%)" },
      content: "Suggested change for better error handling",
      timestamp: new Date(Date.now() - 600000),
      resolved: false,
      replies: [],
      type: "suggestion",
      suggestion: {
        original: "if (error) throw error;",
        proposed: "if (error) {\n  console.error(error);\n  throw new Error(`API Error: ${error.message}`);\n}",
      },
    },
  ])

  const [newComment, setNewComment] = useState("")
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [showNewComment, setShowNewComment] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const addComment = () => {
    if (!newComment.trim() || selectedLine === null) return

    const comment = {
      id: Date.now().toString(),
      lineNumber: selectedLine,
      author: currentUser,
      content: newComment,
      timestamp: new Date(),
      resolved: false,
      replies: [],
      type: "comment",
    }

    setComments((prev) => [...prev, comment])
    setNewComment("")
    setSelectedLine(null)
    setShowNewComment(false)
  }

  const addReply = (commentId: string) => {
    if (!replyContent.trim()) return

    const reply = {
      id: `${commentId}-${Date.now()}`,
      author: currentUser,
      content: replyContent,
      timestamp: new Date(),
    }

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, replies: [...comment.replies, reply] } : comment,
      ),
    )

    setReplyContent("")
    setReplyingTo(null)
  }

  const resolveComment = (commentId: string) => {
    setComments((prev) => prev.map((comment) => (comment.id === commentId ? { ...comment, resolved: true } : comment)))
  }

  const acceptSuggestion = (commentId: string) => {
    // In a real implementation, this would apply the suggestion to the code
    console.log("Accepting suggestion:", commentId)
    resolveComment(commentId)
  }

  const unresolvedComments = comments.filter((c) => !c.resolved)
  const resolvedComments = comments.filter((c) => c.resolved)

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Select a file to view comments</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </h3>
            <p className="text-xs text-gray-500">{currentFile.name}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowNewComment(true)
              setSelectedLine(1)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* New Comment Form */}
      {showNewComment && (
        <div className="p-3 border-b bg-gray-50">
          <div className="space-y-2">
            <div className="text-sm">
              <label className="block text-gray-600 mb-1">Line number:</label>
              <input
                type="number"
                value={selectedLine || ""}
                onChange={(e) => setSelectedLine(Number.parseInt(e.target.value) || null)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="Enter line number"
              />
            </div>
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={addComment}>
                Comment
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNewComment(false)
                  setNewComment("")
                  setSelectedLine(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Unresolved Comments */}
          {unresolvedComments.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Open ({unresolvedComments.length})</h4>
              <div className="space-y-4">
                {unresolvedComments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback style={{ backgroundColor: comment.author.color }}>
                          {comment.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">{comment.author.name}</span>
                          <Badge variant="outline" className="text-xs">
                            Line {comment.lineNumber}
                          </Badge>
                          {comment.type === "suggestion" && (
                            <Badge variant="secondary" className="text-xs">
                              Suggestion
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">{formatTimeAgo(comment.timestamp)}</span>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">{comment.content}</p>

                        {comment.suggestion && (
                          <div className="bg-gray-50 rounded p-2 mb-2 text-xs">
                            <div className="mb-2">
                              <div className="text-red-600 mb-1">- Original:</div>
                              <code className="bg-red-50 px-1 rounded">{comment.suggestion.original}</code>
                            </div>
                            <div>
                              <div className="text-green-600 mb-1">+ Suggested:</div>
                              <code className="bg-green-50 px-1 rounded">{comment.suggestion.proposed}</code>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="ml-4 mt-3 space-y-2 border-l-2 border-gray-200 pl-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={reply.author.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">
                                    {reply.author.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-medium">{reply.author.name}</span>
                                    <span className="text-xs text-gray-500">{formatTimeAgo(reply.timestamp)}</span>
                                  </div>
                                  <p className="text-xs text-gray-700 mt-1">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              placeholder="Write a reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => addReply(comment.id)}>
                                Reply
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyContent("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center space-x-2 mt-3">
                          <Button size="sm" variant="ghost" onClick={() => setReplyingTo(comment.id)}>
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>

                          {comment.type === "suggestion" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => acceptSuggestion(comment.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveComment(comment.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Comments */}
          {resolvedComments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Resolved ({resolvedComments.length})</h4>
              <div className="space-y-2">
                {resolvedComments.map((comment) => (
                  <div key={comment.id} className="border rounded p-2 bg-gray-50 opacity-75">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Line {comment.lineNumber}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Resolved
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comments.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No comments yet</p>
              <p className="text-xs">Add the first comment to start a discussion</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
