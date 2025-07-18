"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Clock, FileText, MessageSquare, Trash2 } from "lucide-react"
import { useChatContext } from "@/contexts/chat-context"
import { formatDistanceToNow } from "date-fns"

interface ChatHistoryProps {
  analysisType: "income_statement" | "balance_sheet" | "combined"
  onSelectSession?: (sessionId: string) => void
}

export function ChatHistory({ analysisType, onSelectSession }: ChatHistoryProps) {
  const { sessions, deleteSession, currentSessionId } = useChatContext()
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  // Filter sessions by analysis type
  const filteredSessions = sessions.filter((session) => session.analysisType === analysisType)

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    onSelectSession?.(sessionId)
  }

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteSession(sessionId)
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null)
    }
  }

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case "income_statement":
        return "Income Statement"
      case "balance_sheet":
        return "Balance Sheet"
      case "combined":
        return "Combined Analysis"
      default:
        return "Analysis"
    }
  }

  const getAnalysisTypeColor = (type: string) => {
    switch (type) {
      case "income_statement":
        return "bg-green-100 text-green-800"
      case "balance_sheet":
        return "bg-blue-100 text-blue-800"
      case "combined":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Session History</span>
        </CardTitle>
        <CardDescription>Previous {getAnalysisTypeLabel(analysisType).toLowerCase()} analysis sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No previous sessions found</p>
              <p className="text-sm">Upload and analyze a file to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    currentSessionId === session.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{session.fileName}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`text-xs ${getAnalysisTypeColor(session.analysisType)}`}>
                          {getAnalysisTypeLabel(session.analysisType)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{session.messages.length} messages</span>
                    </div>
                    {session.fileHash && (
                      <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {session.fileHash.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface ChatMessagesProps {
  sessionId: string
}

export function ChatMessages({ sessionId }: ChatMessagesProps) {
  const { getSession } = useChatContext()
  const session = getSession(sessionId)

  if (!session) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Session not found</p>
      </div>
    )
  }

  const conversationMessages = session.messages.filter(
    (message) => message.type === "question" || message.type === "response",
  )

  return (
    <ScrollArea className="h-[400px]">
      {conversationMessages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No conversation history</p>
          <p className="text-sm">Ask questions about the analysis to start a conversation</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversationMessages.map((message, index) => (
            <div key={index}>
              <div
                className={`p-3 rounded-lg ${
                  message.type === "question"
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "bg-gray-50 border-l-4 border-gray-500"
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={message.type === "question" ? "default" : "secondary"}>
                    {message.type === "question" ? "Question" : "AI Response"}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {message.type === "response" ? (
                    <div dangerouslySetInnerHTML={{ __html: message.content }} />
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
              {index < conversationMessages.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  )
}
