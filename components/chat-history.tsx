"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, MessageSquare, FileText, Clock } from "lucide-react"
import { useChatContext } from "@/contexts/chat-context"
import { formatDistanceToNow } from "date-fns"

interface ChatHistoryProps {
  analysisType: "balance_sheet" | "income_statement" | "combined"
  onSelectSession?: (sessionId: string) => void
}

export function ChatHistory({ analysisType, onSelectSession }: ChatHistoryProps) {
  const { sessions, currentSessionId, setCurrentSession, deleteSession } = useChatContext()

  const filteredSessions = sessions.filter((session) => session.analysisType === analysisType)

  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId)
    onSelectSession?.(sessionId)
  }

  const handleDeleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    deleteSession(sessionId)
  }

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case "balance_sheet":
        return "Balance Sheet"
      case "income_statement":
        return "Income Statement"
      case "combined":
        return "Combined Analysis"
      default:
        return "Analysis"
    }
  }

  const getAnalysisTypeColor = (type: string) => {
    switch (type) {
      case "balance_sheet":
        return "bg-blue-100 text-blue-800"
      case "income_statement":
        return "bg-green-100 text-green-800"
      case "combined":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (filteredSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Chat History</span>
          </CardTitle>
          <CardDescription>
            Previous {getAnalysisTypeLabel(analysisType).toLowerCase()} analysis sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No previous sessions found</p>
            <p className="text-sm">Upload and analyze a document to start</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Chat History</span>
        </CardTitle>
        <CardDescription>
          Previous {getAnalysisTypeLabel(analysisType).toLowerCase()} analysis sessions ({filteredSessions.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  currentSessionId === session.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getAnalysisTypeColor(session.analysisType)}>
                        {getAnalysisTypeLabel(session.analysisType)}
                      </Badge>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(session.createdAt, { addSuffix: true })}
                      </div>
                    </div>

                    <h4 className="font-medium text-gray-900 truncate mb-1">{session.fileName}</h4>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{session.messages.length} messages</span>
                      <span>Hash: {session.fileHash.substring(0, 8)}...</span>
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
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function ChatMessages({ sessionId }: { sessionId: string }) {
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

  const conversationMessages = session.messages.filter((msg) => msg.type === "question" || msg.type === "response")

  if (conversationMessages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No conversation history</p>
        <p className="text-sm">Ask a follow-up question to start chatting</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-4">
        {conversationMessages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.type === "question"
                ? "bg-blue-50 border-l-4 border-blue-500 ml-4"
                : "bg-gray-50 border-l-4 border-gray-500 mr-4"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-medium ${message.type === "question" ? "text-blue-700" : "text-gray-700"}`}
              >
                {message.type === "question" ? "Your Question" : "AI Response"}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>
            <div className={`text-sm ${message.type === "question" ? "text-blue-900" : "text-gray-900"}`}>
              {message.type === "response" ? (
                <div dangerouslySetInnerHTML={{ __html: message.content }} />
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
